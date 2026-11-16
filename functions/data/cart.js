import { nanoid } from 'nanoid'
import { getEffectiveUnitPrice, getProduct } from './products.js'

export const CART_COOKIE_NAME = 'fg_cart'
const CART_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days
const MAX_ITEM_QTY = 99

export function parseCartCookie(request) {
  const cookieHeader = request.headers.get('Cookie') || ''
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rest] = part.trim().split('=')
    if (rawName === CART_COOKIE_NAME) {
      const val = rest.join('=').trim()
      if (/^[a-zA-Z0-9_-]{8,64}$/.test(val)) {
        return val
      }
    }
  }
  return null
}

export function buildCartCookieHeader(guestId, request) {
  const isSecure = new URL(request.url).protocol === 'https:'
  const parts = [`${CART_COOKIE_NAME}=${guestId}`, 'Path=/', `Max-Age=${CART_TTL_SECONDS}`, 'HttpOnly', 'SameSite=Lax']
  if (isSecure) parts.push('Secure')
  return parts.join('; ')
}

function mergeRawItems(primaryItems = [], secondaryItems = []) {
  const map = new Map()
  for (const item of primaryItems) {
    if (!item?.productId) continue
    map.set(item.productId, Math.min(MAX_ITEM_QTY, Math.max(1, Math.round(Number(item.quantity) || 1))))
  }
  for (const item of secondaryItems) {
    if (!item?.productId) continue
    const prev = map.get(item.productId) || 0
    const add = Math.max(1, Math.round(Number(item.quantity) || 1))
    map.set(item.productId, Math.min(MAX_ITEM_QTY, prev + add))
  }
  return Array.from(map.entries()).map(([productId, quantity]) => ({ productId, quantity }))
}

async function loadRawCartState(c, { createGuestIfMissing = false } = {}) {
  const guestCookieId = parseCartCookie(c.request)

  if (c.data.user?.id) {
    const key = `cart:user:${c.data.user.id}`
    const stored = (await c.data.kv.getJSON(key)) || { items: [] }
    let items = Array.isArray(stored.items) ? stored.items : []

    if (guestCookieId) {
      const guestKey = `cart:guest:${guestCookieId}`
      const guestStored = await c.data.kv.getJSON(guestKey)
      if (guestStored?.items?.length) {
        items = mergeRawItems(items, guestStored.items)
        await c.data.kv.putJSON(
          key,
          { items, updatedAt: new Date().toISOString() },
          { expirationTtl: CART_TTL_SECONDS },
        )
        await c.data.kv.delete(guestKey)
      }
    }

    return { key, items, setCookieHeader: null }
  }

  let guestId = guestCookieId
  let setCookieHeader = null
  if (!guestId && createGuestIfMissing) {
    guestId = nanoid(24)
    setCookieHeader = buildCartCookieHeader(guestId, c.request)
  }

  if (!guestId) {
    return { key: null, items: [], setCookieHeader: null }
  }

  const key = `cart:guest:${guestId}`
  const stored = (await c.data.kv.getJSON(key)) || { items: [] }
  const items = Array.isArray(stored.items) ? stored.items : []
  return { key, items, setCookieHeader }
}

export async function hydrateCartItems(c, rawItems = []) {
  const items = []
  let itemCount = 0
  let subtotal = 0
  let total = 0

  for (const entry of rawItems) {
    const productId = String(entry?.productId || '').trim()
    const requestedQty = Math.round(Number(entry?.quantity) || 0)
    if (!productId || requestedQty <= 0) continue

    const product = await getProduct(c, productId)
    if (!product) continue

    const stockCount =
      typeof product.data?.stockCount === 'number' ? Math.max(0, Math.floor(product.data.stockCount)) : null
    const inStock = product.data?.inStock !== false && (stockCount === null || stockCount > 0)
    const maxAllowed = stockCount !== null && stockCount > 0 ? Math.min(MAX_ITEM_QTY, stockCount) : MAX_ITEM_QTY
    const quantity = Math.min(maxAllowed, Math.max(1, requestedQty))

    const unitPrice = Math.round((Number(product.price) || 0) * 100) / 100
    const discount = Math.min(Math.max(Number(product.data?.discount) || 0, 0), 99)
    const finalUnitPrice = getEffectiveUnitPrice(product)
    const lineSubtotal = Math.round(unitPrice * quantity * 100) / 100
    const lineTotal = Math.round(finalUnitPrice * quantity * 100) / 100

    items.push({
      productId: product.id,
      name: product.name,
      image: product.image || null,
      category: product.data?.category || null,
      unitPrice,
      discount,
      finalUnitPrice,
      quantity,
      lineSubtotal,
      lineTotal,
      inStock,
      stockCount,
    })

    itemCount += quantity
    subtotal += lineSubtotal
    total += lineTotal
  }

  subtotal = Math.round(subtotal * 100) / 100
  total = Math.round(total * 100) / 100
  const discountTotal = Math.max(0, Math.round((subtotal - total) * 100) / 100)

  return {
    items,
    itemCount,
    subtotal,
    discountTotal,
    total,
    currency: 'USD',
  }
}

export async function getCart(c) {
  const { key, items } = await loadRawCartState(c, { createGuestIfMissing: false })
  const cart = await hydrateCartItems(c, items)
  if (key && cart.items.length !== items.length) {
    const cleaned = cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
    await c.data.kv.putJSON(
      key,
      { items: cleaned, updatedAt: new Date().toISOString() },
      { expirationTtl: CART_TTL_SECONDS },
    )
  }
  return { cart, setCookieHeader: null }
}

export async function updateCartItem(c, { productId, quantity = 1, mode = 'add' }) {
  const id = String(productId || '').trim()
  if (!id) {
    throw new Error('productId is required')
  }

  const state = await loadRawCartState(c, { createGuestIfMissing: true })
  const map = new Map(state.items.map((i) => [i.productId, Number(i.quantity) || 1]))

  const qtyNum = Math.round(Number(quantity))
  if (!Number.isFinite(qtyNum)) {
    throw new Error('Valid quantity is required')
  }

  const targetQty = mode === 'add' ? (map.get(id) || 0) + qtyNum : qtyNum

  if (targetQty <= 0) {
    map.delete(id)
  } else {
    const product = await getProduct(c, id)
    if (!product) {
      const err = new Error('Product not found')
      err.status = 404
      throw err
    }
    const stockCount =
      typeof product.data?.stockCount === 'number' ? Math.max(0, Math.floor(product.data.stockCount)) : null
    if (product.data?.inStock === false || (stockCount !== null && stockCount <= 0)) {
      const err = new Error(`"${product.name}" is currently out of stock`)
      err.status = 400
      throw err
    }
    const capped =
      stockCount !== null ? Math.min(MAX_ITEM_QTY, stockCount, targetQty) : Math.min(MAX_ITEM_QTY, targetQty)
    map.set(id, capped)
  }

  const nextRaw = Array.from(map.entries()).map(([pid, qty]) => ({ productId: pid, quantity: qty }))
  await c.data.kv.putJSON(
    state.key,
    { items: nextRaw, updatedAt: new Date().toISOString() },
    { expirationTtl: CART_TTL_SECONDS },
  )

  const cart = await hydrateCartItems(c, nextRaw)
  return { cart, setCookieHeader: state.setCookieHeader }
}

export async function clearCart(c) {
  const { key } = await loadRawCartState(c, { createGuestIfMissing: false })
  if (key) {
    await c.data.kv.delete(key)
  }
  return {
    items: [],
    itemCount: 0,
    subtotal: 0,
    discountTotal: 0,
    total: 0,
    currency: 'USD',
  }
}
