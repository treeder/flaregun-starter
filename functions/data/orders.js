import { customAlphabet } from 'nanoid'
import { escapeHtml } from '../utils.js'
import { renderEmailTemplate } from '../services/mailer.js'
import { clearCart, getCart } from './cart.js'
import { Product, getEffectiveUnitPrice, getProduct } from './products.js'

const generateOrderCode = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8)

export class Order {
  static properties = {
    id: {
      type: String,
      primaryKey: true,
    },
    orderNumber: {
      type: String,
      index: { unique: true },
    },
    userId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      index: true,
    },
    total: {
      type: Number,
    },
    currency: {
      type: String,
    },
    customerEmail: {
      type: String,
    },
    customerName: {
      type: String,
    },
    shippingAddress: {
      type: String,
    },
    items: {
      type: Object,
    },
    data: {
      type: Object,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  }
}

export async function getUserOrders(c, opts = {}) {
  if (!c.data.user?.id) return []
  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 100)
  return await c.data.d1.query(Order, {
    where: { userId: c.data.user.id },
    order: ['createdAt', 'desc'],
    limit,
  })
}

export async function getUserOrder(c, id) {
  if (!c.data.user?.id || !id) return null
  const order = await c.data.d1.get(Order, id)
  if (!order) return null
  if (order.userId !== c.data.user.id) {
    const err = new Error('Forbidden: you can only view your own orders')
    err.status = 403
    throw err
  }
  return order
}

export async function createOrder(c, input = {}) {
  const user = c.data.user
  if (!user?.id) {
    const err = new Error('Authentication required to place an order')
    err.status = 401
    throw err
  }

  let requestedItems = null
  const fromExplicitItems = Array.isArray(input.items) && input.items.length > 0

  if (fromExplicitItems) {
    const merged = new Map()
    for (const entry of input.items) {
      const pid = String(entry?.productId || '').trim()
      const qty = Math.round(Number(entry?.quantity) || 0)
      if (!pid || qty <= 0) continue
      merged.set(pid, (merged.get(pid) || 0) + qty)
    }
    requestedItems = Array.from(merged.entries()).map(([productId, quantity]) => ({ productId, quantity }))
  } else {
    const { cart } = await getCart(c)
    requestedItems = cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
  }

  if (!requestedItems || requestedItems.length === 0) {
    const err = new Error('Your cart is empty')
    err.status = 400
    throw err
  }

  const resolvedLines = []
  let subtotal = 0
  let total = 0

  for (const reqItem of requestedItems) {
    const product = await getProduct(c, reqItem.productId)
    if (!product) {
      const err = new Error(`Product "${reqItem.productId}" is no longer available`)
      err.status = 404
      throw err
    }

    const quantity = Math.min(99, Math.max(1, Math.round(Number(reqItem.quantity) || 1)))
    const stockCount =
      typeof product.data?.stockCount === 'number' ? Math.max(0, Math.floor(product.data.stockCount)) : null

    if (product.data?.inStock === false || (stockCount !== null && stockCount <= 0)) {
      const err = new Error(`"${product.name}" is out of stock`)
      err.status = 400
      throw err
    }

    if (stockCount !== null && quantity > stockCount) {
      const err = new Error(`Only ${stockCount} unit(s) of "${product.name}" remaining in stock`)
      err.status = 400
      throw err
    }

    const unitPrice = Math.round((Number(product.price) || 0) * 100) / 100
    const discount = Math.min(Math.max(Number(product.data?.discount) || 0, 0), 99)
    const finalUnitPrice = getEffectiveUnitPrice(product)
    const lineSubtotal = Math.round(unitPrice * quantity * 100) / 100
    const lineTotal = Math.round(finalUnitPrice * quantity * 100) / 100

    resolvedLines.push({
      product,
      lineItem: {
        productId: product.id,
        name: product.name,
        image: product.image || null,
        unitPrice,
        discount,
        finalUnitPrice,
        quantity,
        lineSubtotal,
        lineTotal,
      },
    })

    subtotal += lineSubtotal
    total += lineTotal
  }

  subtotal = Math.round(subtotal * 100) / 100
  total = Math.round(total * 100) / 100
  const discountTotal = Math.max(0, Math.round((subtotal - total) * 100) / 100)

  // Decrement inventory for products tracking stockCount
  for (const { product, lineItem } of resolvedLines) {
    if (typeof product.data?.stockCount === 'number') {
      const nextStock = Math.max(0, Math.floor(product.data.stockCount) - lineItem.quantity)
      await c.data.d1.update(Product, product.id, {
        data: {
          stockCount: nextStock,
          inStock: nextStock > 0,
        },
      })
    }
  }

  const customerName = String(input.customerName || user.name || '')
    .trim()
    .slice(0, 120)
  const customerEmail = String(user.email || input.customerEmail || '')
    .trim()
    .slice(0, 160)
  const shippingAddress = String(input.shippingAddress || '')
    .trim()
    .slice(0, 400)
  const notes = String(input.notes || '')
    .trim()
    .slice(0, 500)

  const orderRecord = {
    orderNumber: `FG-${generateOrderCode()}`,
    userId: user.id,
    status: 'confirmed',
    total,
    currency: 'USD',
    customerEmail,
    customerName: customerName || (customerEmail ? customerEmail.split('@')[0] : 'Customer'),
    shippingAddress,
    items: resolvedLines.map((r) => r.lineItem),
    data: {
      subtotal,
      discountTotal,
      itemCount: resolvedLines.reduce((sum, r) => sum + r.lineItem.quantity, 0),
      notes: notes || null,
      paymentMethod: 'demo_checkout',
    },
  }

  await c.data.d1.insert(Order, orderRecord)
  if (!fromExplicitItems) {
    await clearCart(c)
  }

  let emailSent = false
  if (customerEmail) {
    try {
      const origin = new URL(c.request.url).origin
      const itemsHtml = orderRecord.items
        .map(
          (item) =>
            `<li><strong>${escapeHtml(item.name)}</strong> &times; ${item.quantity} &mdash; $${item.lineTotal.toFixed(2)}</li>`,
        )
        .join('')
      const addressBlock = shippingAddress
        ? `<p style="margin: 12px 0 0;"><strong>Shipping to:</strong><br>${escapeHtml(shippingAddress).replace(/\n/g, '<br>')}</p>`
        : ''

      const htmlBody = renderEmailTemplate({
        title: `Order Confirmed (${orderRecord.orderNumber})`,
        content: `<p style="margin: 0 0 12px;">Thanks for your order, <strong>${escapeHtml(orderRecord.customerName)}</strong>!</p>
          <ul style="padding-left: 20px; margin: 12px 0;">${itemsHtml}</ul>
          <p style="margin: 12px 0 0; font-size: 16px;"><strong>Total: $${orderRecord.total.toFixed(2)} USD</strong></p>
          ${addressBlock}`,
        link: origin ? `${origin}/orders` : '',
        linkText: 'View Your Orders',
        footerText: `Order ${orderRecord.orderNumber} placed on Flaregun Marketplace.`,
        appName: 'Flaregun',
      })

      const textSummary = [
        `Order Confirmed: ${orderRecord.orderNumber}`,
        ...orderRecord.items.map((i) => `- ${i.name} x${i.quantity}: $${i.lineTotal.toFixed(2)}`),
        `Total: $${orderRecord.total.toFixed(2)} USD`,
        shippingAddress ? `Shipping to: ${shippingAddress}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      await c.data.mailer.send({
        to: customerEmail,
        subject: `Order Confirmed - ${orderRecord.orderNumber}`,
        html: htmlBody,
        text: textSummary,
      })
      emailSent = true
    } catch (mailErr) {
      c.data.logger.error('Failed to send order confirmation email', mailErr)
    }
  }

  const saved = await c.data.d1.get(Order, orderRecord.id)
  return { order: saved, emailSent }
}
