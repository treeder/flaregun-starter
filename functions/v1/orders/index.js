import { createOrder, getUserOrders } from '../../data/orders.js'

export async function onRequestGet(c) {
  if (!c.data.user) {
    return Response.json({ error: { message: 'Authentication required to view orders' } }, { status: 401 })
  }

  const orders = await getUserOrders(c)
  return Response.json({ orders })
}

export async function onRequestPost(c) {
  if (!c.data.user) {
    return Response.json({ error: { message: 'Authentication required to place an order' } }, { status: 401 })
  }

  let input = {}
  try {
    input = (await c.request.json()) || {}
  } catch {
    input = {}
  }

  const payload = input.order && typeof input.order === 'object' ? input.order : input

  try {
    const result = await createOrder(c, payload)
    return Response.json(result, { status: 201 })
  } catch (err) {
    return Response.json({ error: { message: err.message || 'Checkout failed' } }, { status: err.status || 400 })
  }
}
