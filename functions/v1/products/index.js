import { Product, getProducts } from '../../data/products.js'

export async function onRequestGet(c) {
  let products = await getProducts(c)
  return Response.json({ products })
}

export async function onRequestPost(c) {
  if (!c.data.user) {
    return Response.json({ error: { message: 'Authentication required to create products' } }, { status: 401 })
  }

  let input = await c.request.json()
  let product = input?.product
  if (!product || typeof product !== 'object' || Array.isArray(product) || !String(product.name || '').trim()) {
    return Response.json({ error: { message: 'Valid product payload with a name is required' } }, { status: 400 })
  }

  const record = {
    userId: c.data.user.id,
    name: String(product.name).trim(),
    description: product.description ? String(product.description).trim() : '',
    price: Number(product.price) || 0,
    data: {
      x: 'y', // just to show using JSON fields
      ...(product.data || {}),
      createdBy: c.data.user.id,
    },
  }

  await c.data.d1.insert(Product, record)
  return Response.json({ product: record })
}
