import { Product, getProduct } from '../../../data/products.js'

export async function onRequestGet(c) {
  let product = await getProduct(c, c.params.id)
  if (!product) {
    return Response.json({ error: { message: 'Product not found' } }, { status: 404 })
  }
  return Response.json({ product })
}

async function handleUpdate(c) {
  if (!c.data.user) {
    return Response.json({ error: { message: 'Authentication required to update products' } }, { status: 401 })
  }

  const productId = c.params.id
  const existing = await c.data.d1.get(Product, productId)
  if (!existing) {
    return Response.json({ error: { message: 'Product not found' } }, { status: 404 })
  }
  if (existing.userId !== c.data.user.id) {
    return Response.json({ error: { message: 'Forbidden: you can only update your own products' } }, { status: 403 })
  }

  let input = await c.request.json()
  let payload = input?.product
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return Response.json({ error: { message: 'Valid product payload is required' } }, { status: 400 })
  }

  const updates = {}
  if (payload.name !== undefined) {
    const trimmed = String(payload.name).trim()
    if (!trimmed) {
      return Response.json({ error: { message: 'Product name cannot be empty' } }, { status: 400 })
    }
    updates.name = trimmed
  }
  if (payload.description !== undefined) updates.description = String(payload.description).trim()
  if (payload.price !== undefined) updates.price = Number(payload.price) || 0
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    updates.data = {
      ...(existing.data || {}),
      ...payload.data,
      createdBy: existing.data?.createdBy || c.data.user.id,
      updatedBy: c.data.user.id,
    }
  }

  await c.data.d1.update(Product, productId, updates)
  const product = await c.data.d1.get(Product, productId)
  return Response.json({ product })
}

export const onRequestPut = handleUpdate
export const onRequestPatch = handleUpdate
export const onRequestPost = handleUpdate

export async function onRequestDelete(c) {
  if (!c.data.user) {
    return Response.json({ error: { message: 'Authentication required to delete products' } }, { status: 401 })
  }

  const productId = c.params.id
  const existing = await c.data.d1.get(Product, productId)
  if (!existing) {
    return Response.json({ error: { message: 'Product not found' } }, { status: 404 })
  }
  if (existing.userId !== c.data.user.id) {
    return Response.json({ error: { message: 'Forbidden: you can only delete your own products' } }, { status: 403 })
  }

  await c.data.d1.delete(Product, productId)
  return Response.json({ message: 'Product deleted successfully' })
}
