import { Product } from './products.js'
import { User } from './users.js'
import { formatSeller } from './products.js'

export class Review {
  static properties = {
    id: {
      type: String,
      primaryKey: true,
    },
    productId: {
      type: String,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    rating: {
      type: Number,
    },
    title: {
      type: String,
    },
    body: {
      type: String,
    },
    reviewerName: {
      type: String,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
    data: {
      type: Object,
    },
  }
}

export function unwrapJoinedReview(row) {
  if (!row) return null
  const review = row.review ? row.review : row
  const joinedAuthor = row.review ? formatSeller(row.author) : null
  const author = joinedAuthor || {
    id: review.userId || null,
    name: review.reviewerName || 'Verified Shopper',
    image: null,
  }
  return {
    ...review,
    author,
  }
}

export async function getProductReviews(c, productId, opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 100)
  const rows = await c.data.d1.query(Review, {
    where: { productId },
    order: ['createdAt', 'desc'],
    limit,
    join: [{ type: 'LEFT', table: User, as: 'author', on: ['userId', '=', 'id'] }],
  })
  return rows.map(unwrapJoinedReview)
}

export async function recalculateProductRating(c, productId) {
  const reviews = await c.data.d1.query(Review, {
    where: { productId },
  })
  const ratingCount = reviews.length
  const ratingAvg =
    ratingCount > 0
      ? Math.round((reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / ratingCount) * 10) / 10
      : 0

  await c.data.d1.update(Product, productId, {
    data: {
      ratingAvg,
      ratingCount,
    },
  })

  return { ratingAvg, ratingCount }
}

export async function upsertProductReview(c, { productId, rating, title = '', body = '' }) {
  const numRating = Math.round(Number(rating))
  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    throw new Error('Rating must be an integer between 1 and 5')
  }

  const trimmedTitle = String(title || '')
    .trim()
    .slice(0, 120)
  const trimmedBody = String(body || '')
    .trim()
    .slice(0, 2000)

  const user = c.data.user
  const reviewerName = user.name || (user.email ? user.email.split('@')[0] : 'Verified Shopper')

  const existing = await c.data.d1.first(Review, {
    where: {
      productId,
      userId: user.id,
    },
  })

  let reviewId
  if (existing) {
    reviewId = existing.id
    await c.data.d1.update(Review, existing.id, {
      rating: numRating,
      title: trimmedTitle,
      body: trimmedBody,
      reviewerName,
    })
  } else {
    const inserted = await c.data.d1.insert(Review, {
      productId,
      userId: user.id,
      rating: numRating,
      title: trimmedTitle,
      body: trimmedBody,
      reviewerName,
      data: {},
    })
    reviewId = inserted.id
  }

  const summary = await recalculateProductRating(c, productId)
  const row = await c.data.d1.first(Review, {
    where: { id: reviewId },
    join: [{ type: 'LEFT', table: User, as: 'author', on: ['userId', '=', 'id'] }],
  })

  return {
    review: unwrapJoinedReview(row),
    summary,
    updatedExisting: Boolean(existing),
  }
}

const SAMPLE_REVIEWS = [
  {
    productName: 'Wireless Studio Headphones',
    rating: 5,
    title: 'Crystal-clear sound & all-day comfort',
    body: 'Noise cancellation blocks out cabin and cafe noise effortlessly, and battery life easily lasts a full workweek.',
    reviewerName: 'Maya Lin',
  },
  {
    productName: 'Wireless Studio Headphones',
    rating: 4,
    title: 'Great studio tuning',
    body: 'Balanced mids and crisp highs out of the box. Multipoint pairing works smoothly across laptop and phone.',
    reviewerName: 'Jordan Patel',
  },
  {
    productName: 'Mechanical Split Keyboard',
    rating: 5,
    title: 'Saved my wrists',
    body: 'Took two days to adjust to the split tenting angle and now I can never go back to a flat board.',
    reviewerName: 'Alex Rivera',
  },
  {
    productName: 'Cloudflare Edge Architecture Guide',
    rating: 5,
    title: 'Practical D1 + R2 + KV patterns',
    body: 'Clear examples on JSON merge patches, edge caching, and MCP agent endpoints without framework bloat.',
    reviewerName: 'Samira Chen',
  },
]

export async function seedReviews(c) {
  try {
    const count = await c.data.d1.count(Review)
    if (count > 0) return

    const sampleProducts = await c.data.d1.query(Product, { where: { userId: null } })
    if (!sampleProducts.length) return

    const byName = new Map(sampleProducts.map((p) => [p.name, p]))
    const touchedProductIds = new Set()

    for (const item of SAMPLE_REVIEWS) {
      const product = byName.get(item.productName)
      if (!product) continue
      await c.data.d1.insert(Review, {
        productId: product.id,
        userId: null,
        rating: item.rating,
        title: item.title,
        body: item.body,
        reviewerName: item.reviewerName,
        data: { seeded: true },
      })
      touchedProductIds.add(product.id)
    }

    for (const productId of touchedProductIds) {
      await recalculateProductRating(c, productId)
    }
  } catch (err) {
    c.data.logger.error('Failed to seed reviews', err)
  }
}
