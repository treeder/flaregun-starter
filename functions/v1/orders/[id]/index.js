import { getUserOrder } from '../../../data/orders.js'

export async function onRequestGet(c) {
  if (!c.data.user) {
    return Response.json({ error: { message: 'Authentication required to view orders' } }, { status: 401 })
  }

  try {
    const order = await getUserOrder(c, c.params.id)
    if (!order) {
      return Response.json({ error: { message: 'Order not found' } }, { status: 404 })
    }
    return Response.json({ order })
  } catch (err) {
    return Response.json({ error: { message: err.message || 'Forbidden' } }, { status: err.status || 403 })
  }
}
