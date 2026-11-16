import { clearCart, getCart, updateCartItem } from '../../data/cart.js'

function jsonWithCartCookie(body, setCookieHeader, status = 200) {
  const headers = new Headers()
  if (setCookieHeader) {
    headers.set('Set-Cookie', setCookieHeader)
  }
  return Response.json(body, { status, headers })
}

export async function onRequestGet(c) {
  const { cart, setCookieHeader } = await getCart(c)
  return jsonWithCartCookie({ cart }, setCookieHeader)
}

export async function onRequestPost(c) {
  let body
  try {
    body = await c.request.json()
  } catch {
    return Response.json({ error: { message: 'Invalid JSON body' } }, { status: 400 })
  }

  try {
    const quantity = body?.quantity !== undefined ? Number(body.quantity) : 1
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return Response.json({ error: { message: 'Quantity must be at least 1' } }, { status: 400 })
    }
    const { cart, setCookieHeader } = await updateCartItem(c, {
      productId: body?.productId,
      quantity,
      mode: body?.mode === 'set' ? 'set' : 'add',
    })
    return jsonWithCartCookie({ cart }, setCookieHeader)
  } catch (err) {
    return Response.json({ error: { message: err.message || 'Failed to update cart' } }, { status: err.status || 400 })
  }
}

export async function onRequestPut(c) {
  let body
  try {
    body = await c.request.json()
  } catch {
    return Response.json({ error: { message: 'Invalid JSON body' } }, { status: 400 })
  }

  try {
    const { cart, setCookieHeader } = await updateCartItem(c, {
      productId: body?.productId,
      quantity: body?.quantity,
      mode: 'set',
    })
    return jsonWithCartCookie({ cart }, setCookieHeader)
  } catch (err) {
    return Response.json({ error: { message: err.message || 'Failed to update cart' } }, { status: err.status || 400 })
  }
}

export async function onRequestDelete(c) {
  const url = new URL(c.request.url)
  const productId = url.searchParams.get('productId')?.trim()

  if (productId) {
    try {
      const { cart, setCookieHeader } = await updateCartItem(c, {
        productId,
        quantity: 0,
        mode: 'set',
      })
      return jsonWithCartCookie({ cart }, setCookieHeader)
    } catch (err) {
      return Response.json(
        { error: { message: err.message || 'Failed to remove item' } },
        { status: err.status || 400 },
      )
    }
  }

  const cart = await clearCart(c)
  return Response.json({ cart })
}
