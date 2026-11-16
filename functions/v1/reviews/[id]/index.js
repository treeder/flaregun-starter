import { Review, recalculateProductRating } from '../../../data/reviews.js'

export async function onRequestDelete(c) {
  if (!c.data.user) {
    return Response.json({ error: { message: 'Authentication required to delete reviews' } }, { status: 401 })
  }

  const reviewId = c.params.id
  const existing = await c.data.d1.get(Review, reviewId)
  if (!existing) {
    return Response.json({ error: { message: 'Review not found' } }, { status: 404 })
  }
  if (existing.userId !== c.data.user.id) {
    return Response.json({ error: { message: 'Forbidden: you can only delete your own reviews' } }, { status: 403 })
  }

  await c.data.d1.delete(Review, reviewId)
  const summary = await recalculateProductRating(c, existing.productId)
  return Response.json({ deleted: true, id: reviewId, summary })
}
