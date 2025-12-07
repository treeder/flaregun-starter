import { Product } from '../../../data/products.js'

export async function onRequestDelete(c) {
  const productId = c.params.id
  await c.data.d1.delete(Product, productId)
  return Response.json({ message: 'Product deleted successfully' })
}
