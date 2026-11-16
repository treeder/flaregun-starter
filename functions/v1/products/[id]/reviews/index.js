import { getProduct } from '../../../../data/products.js'
import { getProductReviews, upsertProductReview } from '../../../../data/reviews.js'

export async function onRequestGet(c) {
  const product = await getProduct(c, c.params.id)
  if (!product) {
    return Response.json({ error: { message: 'Product not found' } }, { status: 404 })
  }

  const reviews = await getProductReviews(c, product.id)
  const summary = {
    ratingAvg: Number(product.data?.ratingAvg) || 0,
    ratingCount: Number(product.data?.ratingCount) || reviews.length,
  }

  return Response.json({ reviews, summary })
}

export async function onRequestPost(c) {
  if (!c.data.user) {
    return Response.json({ error: { message: 'Authentication required to leave a review' } }, { status: 401 })
  }

  const product = await getProduct(c, c.params.id)
  if (!product) {
    return Response.json({ error: { message: 'Product not found' } }, { status: 404 })
  }

  let input
  try {
    input = await c.request.json()
  } catch {
    return Response.json({ error: { message: 'Invalid JSON body' } }, { status: 400 })
  }

  const payload = input?.review || input || {}
  const rating = Number(payload.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json({ error: { message: 'Rating must be an integer from 1 to 5' } }, { status: 400 })
  }

  const result = await upsertProductReview(c, {
    productId: product.id,
    rating,
    title: payload.title,
    body: payload.body,
  })

  return Response.json(result, { status: result.updatedExisting ? 200 : 201 })
}
