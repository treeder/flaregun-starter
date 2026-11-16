import { User } from './users.js'

// Define your models as classes with a static properties attribute:
export class Product {
  static properties = {
    id: {
      type: String,
      primaryKey: true,
    },
    userId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      index: true,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
    },
    image: {
      type: String,
    },
    data: {
      type: Object, // stored as a JSON object so you can stuff anything in here and still query on it.
    },
  }
}

export const SAMPLE_PRODUCTS = [
  {
    name: 'Wireless Studio Headphones',
    description: 'Active noise-canceling over-ear headphones with 40-hour battery life and spatial audio.',
    price: 249.99,
    status: 'active',
    image: '/images/products/headphones.svg',
    data: {
      category: 'electronics',
      inStock: true,
      stockCount: 18,
      discount: 15,
      published: true,
    },
  },
  {
    name: 'Mechanical Split Keyboard',
    description: 'Hot-swappable ergonomic mechanical keyboard with custom tactile switches and RGB underglow.',
    price: 179.0,
    status: 'active',
    image: '/images/products/keyboard.svg',
    data: {
      category: 'electronics',
      inStock: true,
      stockCount: 12,
      discount: 0,
      published: true,
    },
  },
  {
    name: 'Cloudflare Edge Architecture Guide',
    description: 'Comprehensive handbook on building globally distributed applications with Workers, D1, R2, and KV.',
    price: 39.5,
    status: 'active',
    image: '/images/products/guide.svg',
    data: {
      category: 'books',
      inStock: true,
      stockCount: 50,
      discount: 10,
      published: true,
    },
  },
  {
    name: 'Minimalist Desk Mat',
    description: 'Water-resistant merino wool felt and vegan leather desk pad for a clean workspace.',
    price: 45.0,
    status: 'active',
    image: '/images/products/desk-mat.svg',
    data: {
      category: 'accessories',
      inStock: false,
      stockCount: 0,
      discount: 0,
      published: true,
    },
  },
]

export function formatSeller(seller) {
  if (!seller || !seller.id) return null
  const fallbackName = seller.email ? seller.email.split('@')[0] : 'Community Seller'
  return {
    id: seller.id,
    name: seller.name || fallbackName,
    image: seller.image || null,
  }
}

export function getEffectiveUnitPrice(product) {
  const basePrice = Math.max(0, Number(product?.price) || 0)
  const discount = Math.min(Math.max(Number(product?.data?.discount) || 0, 0), 99)
  const discounted = basePrice * (1 - discount / 100)
  return Math.round(discounted * 100) / 100
}

export function resolveProductStatus(payload = {}, fallbackStatus = 'active') {
  if (payload.status === 'draft' || payload.data?.published === false) {
    return 'draft'
  }
  if (payload.status === 'active' || payload.data?.published === true) {
    return 'active'
  }
  return fallbackStatus
}

export function unwrapJoinedProduct(row) {
  if (!row) return null
  const product = row.product ? row.product : row
  const seller = row.product ? formatSeller(row.seller) : row.seller || null
  return {
    ...product,
    image: product.image || product.data?.image || null,
    seller,
  }
}

export async function seedProducts(c) {
  try {
    const existingSamples = await c.data.d1.query(Product, { where: { userId: null } })
    if (existingSamples.length === 0) {
      for (const item of SAMPLE_PRODUCTS) {
        await c.data.d1.insert(Product, { ...item, userId: null })
      }
    } else {
      await c.data.d1.prepare("UPDATE products SET status = 'active' WHERE status IS NULL").run()
      const sampleByName = new Map(SAMPLE_PRODUCTS.map((s) => [s.name, s]))
      for (const row of existingSamples) {
        const template = sampleByName.get(row.name)
        if (!template) continue
        const needsImage = !row.image && template.image
        const needsStock = row.data?.stockCount === undefined && template.data?.stockCount !== undefined
        if (needsImage || needsStock) {
          await c.data.d1.update(Product, row.id, {
            ...(needsImage ? { image: template.image } : {}),
            ...(needsStock ? { data: { stockCount: template.data.stockCount, published: true } } : {}),
          })
        }
      }
    }
  } catch (err) {
    c.data.logger.error('Failed to seed products', err)
  }
}

export async function getProducts(c, q = {}) {
  const userId = c.data.user?.id || null
  const scope = q.scope || 'all'
  const extraWhere = Array.isArray(q.where)
    ? [...q.where]
    : q.where && typeof q.where === 'object'
      ? Object.entries(q.where).map(([k, v]) => [k, '=', v])
      : []

  if (scope === 'mine') {
    if (!userId) return []
    extraWhere.unshift(['userId', '=', userId])
  } else if (scope === 'sample') {
    extraWhere.unshift(['status', '=', 'active'])
    extraWhere.unshift(['userId', 'is', null])
  } else if (userId) {
    extraWhere.unshift([['status', '=', 'active'], 'or', ['userId', '=', userId]])
  } else {
    extraWhere.unshift(['status', '=', 'active'])
  }

  const { scope: _scope, ...rest } = q
  const rows = await c.data.d1.query(Product, {
    order: ['createdAt', 'desc'],
    ...rest,
    where: extraWhere,
    join: [{ type: 'LEFT', table: User, as: 'seller', on: ['userId', '=', 'id'] }],
  })

  return rows.map(unwrapJoinedProduct)
}

export async function getProduct(c, id) {
  if (!id) return null
  const row = await c.data.d1.first(Product, {
    where: { id },
    join: [{ type: 'LEFT', table: User, as: 'seller', on: ['userId', '=', 'id'] }],
  })
  const product = unwrapJoinedProduct(row)
  if (!product) return null

  const isDraft = product.status === 'draft' || product.data?.published === false
  if (isDraft && product.userId !== c.data.user?.id) {
    return null
  }
  return product
}
