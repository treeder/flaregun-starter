import { getApiKeyScopes, hasApiKeyScope } from '../data/apiKeys.js'
import { createOrder, getUserOrder, getUserOrders } from '../data/orders.js'
import { Product, getProduct, getProducts, resolveProductStatus } from '../data/products.js'
import { getProductReviews, upsertProductReview } from '../data/reviews.js'
import { User } from '../data/users.js'

function assertWriteAccess(c) {
  if (!hasApiKeyScope(c, 'write')) {
    throw new Error('Forbidden: API key lacks required "write" scope')
  }
}

function textResult(data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  return {
    content: [{ type: 'text', text }],
    isError: false,
  }
}

/**
 * Define your app's MCP tools here.
 * Each entry exposes its schema via `tools/list` and executes `handler(c, args)` on `tools/call`.
 */
export const TOOLS = [
  {
    name: 'whoami',
    title: 'Current User',
    description: 'Get the profile and authentication details of the currently authenticated user.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    async handler(c) {
      const user = (await c.data.d1.get(User, c.data.user.id)) || c.data.user
      return textResult({
        user: {
          id: user.id,
          name: user.name || null,
          email: user.email || null,
          image: user.image || null,
          createdAt: user.createdAt || null,
        },
        authMethod: c.data.isAgent ? 'apiKey' : 'session',
        scopes: getApiKeyScopes(c.data.apiKey),
      })
    },
  },
  {
    name: 'listProducts',
    title: 'List Products',
    description: 'List products in the marketplace with optional search, category, stock, and ownership filters.',
    inputSchema: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          enum: ['all', 'mine', 'sample'],
          description:
            'Which products to return: "mine" (owned by you), "sample" (public seeded items), or "all" (marketplace catalog + your drafts, default: "all").',
        },
        search: {
          type: 'string',
          description: 'Optional case-insensitive keyword filter matching name or description.',
        },
        category: {
          type: 'string',
          description: 'Optional category filter (e.g. "electronics", "books", "accessories").',
        },
        inStock: {
          type: 'boolean',
          description: 'Optional stock availability filter.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of products to return (1-100, default: 20).',
        },
      },
    },
    async handler(c, args = {}) {
      const scope = ['all', 'mine', 'sample'].includes(args.scope) ? args.scope : 'all'
      const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 100)

      const where = []
      if (args.category) {
        const rawCat = String(args.category).trim()
        if (rawCat) {
          const lowerCat = rawCat.toLowerCase()
          where.push(
            rawCat === lowerCat
              ? ['data.category', '=', rawCat]
              : [['data.category', '=', rawCat], 'or', ['data.category', '=', lowerCat]],
          )
        }
      }

      if (typeof args.inStock === 'boolean') {
        where.push(['data.inStock', '=', args.inStock])
      }

      if (args.search) {
        const q = String(args.search).trim()
        if (q) {
          const pattern = `%${q}%`
          where.push([['name', 'like', pattern], 'or', ['description', 'like', pattern]])
        }
      }

      const products = await getProducts(c, {
        scope,
        where,
        order: [['createdAt', 'desc']],
        limit,
      })

      return textResult({
        count: products.length,
        products,
      })
    },
  },
  {
    name: 'getProduct',
    title: 'Get Product',
    description: 'Retrieve a single product by ID, including seller attribution and rating summary.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Product ID to retrieve.',
        },
      },
      required: ['id'],
    },
    async handler(c, args = {}) {
      const id = String(args.id || '').trim()
      if (!id) throw new Error('Product id is required')
      const product = await getProduct(c, id)
      if (!product) {
        throw new Error(`Product "${id}" not found`)
      }
      return textResult({ product })
    },
  },
  {
    name: 'createProduct',
    title: 'Create Product',
    description: 'Create a new product listing owned by the authenticated user.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Product name (required).',
        },
        description: {
          type: 'string',
          description: 'Product description.',
        },
        price: {
          type: 'number',
          description: 'Product price in USD.',
        },
        category: {
          type: 'string',
          description: 'Optional product category (e.g. "electronics", "books", "accessories").',
        },
        inStock: {
          type: 'boolean',
          description: 'Whether the product is currently in stock (default: true).',
        },
        stockCount: {
          type: 'number',
          description: 'Optional inventory count.',
        },
        discount: {
          type: 'number',
          description: 'Optional discount percentage (0-99).',
        },
        published: {
          type: 'boolean',
          description: 'Whether to publish publicly on the marketplace (default: true, false saves as private draft).',
        },
      },
      required: ['name'],
    },
    async handler(c, args = {}) {
      assertWriteAccess(c)
      const name = String(args.name || '').trim()
      if (!name) throw new Error('Product name is required')

      const published = args.published !== false
      const stockCount =
        args.stockCount !== undefined && args.stockCount !== null
          ? Math.max(0, Math.floor(Number(args.stockCount) || 0))
          : undefined
      const inStock =
        stockCount !== undefined
          ? stockCount > 0 && args.inStock !== false
          : args.inStock !== undefined
            ? Boolean(args.inStock)
            : true

      const record = {
        userId: c.data.user.id,
        status: published ? 'active' : 'draft',
        name,
        description: args.description !== undefined ? String(args.description).trim() : '',
        price: Math.max(0, Number(args.price) || 0),
        data: {
          category: args.category ? String(args.category).trim().toLowerCase() : 'general',
          inStock,
          ...(stockCount !== undefined ? { stockCount } : {}),
          discount: Math.min(Math.max(Number(args.discount) || 0, 0), 99),
          published,
          createdBy: c.data.user.id,
        },
      }

      await c.data.d1.insert(Product, record)
      const created = await getProduct(c, record.id)
      return textResult({ product: created })
    },
  },
  {
    name: 'updateProduct',
    title: 'Update Product',
    description: 'Update an existing product owned by the authenticated user.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the product to update (required).',
        },
        name: {
          type: 'string',
          description: 'Updated product name.',
        },
        description: {
          type: 'string',
          description: 'Updated product description.',
        },
        price: {
          type: 'number',
          description: 'Updated product price.',
        },
        category: {
          type: 'string',
          description: 'Updated category.',
        },
        inStock: {
          type: 'boolean',
          description: 'Updated stock status.',
        },
        stockCount: {
          type: 'number',
          description: 'Updated inventory count.',
        },
        discount: {
          type: 'number',
          description: 'Updated discount percentage.',
        },
        published: {
          type: 'boolean',
          description: 'Whether the product is published publicly (false marks as private draft).',
        },
      },
      required: ['id'],
    },
    async handler(c, args = {}) {
      assertWriteAccess(c)
      const id = String(args.id || '').trim()
      if (!id) throw new Error('Product id is required')

      const existing = await c.data.d1.get(Product, id)
      if (!existing) throw new Error(`Product "${id}" not found`)
      if (existing.userId !== c.data.user.id) {
        throw new Error('Forbidden: you can only update your own products')
      }

      const updates = {}
      if (args.name !== undefined) {
        const trimmed = String(args.name).trim()
        if (!trimmed) throw new Error('Product name cannot be empty')
        updates.name = trimmed
      }
      if (args.description !== undefined) updates.description = String(args.description).trim()
      if (args.price !== undefined) updates.price = Math.max(0, Number(args.price) || 0)

      if (args.published !== undefined) {
        updates.status = resolveProductStatus(
          { data: { published: Boolean(args.published) } },
          existing.status || 'active',
        )
      }

      if (
        args.category !== undefined ||
        args.inStock !== undefined ||
        args.stockCount !== undefined ||
        args.discount !== undefined ||
        args.published !== undefined
      ) {
        const nextStock =
          args.stockCount !== undefined && args.stockCount !== null
            ? Math.max(0, Math.floor(Number(args.stockCount) || 0))
            : existing.data?.stockCount
        updates.data = {
          ...(existing.data || {}),
          ...(args.category !== undefined ? { category: String(args.category).trim().toLowerCase() } : {}),
          ...(args.inStock !== undefined ? { inStock: Boolean(args.inStock) } : {}),
          ...(args.stockCount !== undefined
            ? { stockCount: nextStock, ...(nextStock === 0 ? { inStock: false } : {}) }
            : {}),
          ...(args.discount !== undefined ? { discount: Math.min(Math.max(Number(args.discount) || 0, 0), 99) } : {}),
          ...(args.published !== undefined ? { published: Boolean(args.published) } : {}),
          createdBy: existing.data?.createdBy || c.data.user.id,
          updatedBy: c.data.user.id,
        }
      }

      await c.data.d1.update(Product, id, updates)
      const product = await getProduct(c, id)
      return textResult({ product })
    },
  },
  {
    name: 'deleteProduct',
    title: 'Delete Product',
    description: 'Delete a product owned by the authenticated user.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the product to delete (required).',
        },
      },
      required: ['id'],
    },
    async handler(c, args = {}) {
      assertWriteAccess(c)
      const id = String(args.id || '').trim()
      if (!id) throw new Error('Product id is required')

      const existing = await c.data.d1.get(Product, id)
      if (!existing) throw new Error(`Product "${id}" not found`)
      if (existing.userId !== c.data.user.id) {
        throw new Error('Forbidden: you can only delete your own products')
      }

      await c.data.d1.prepare('DELETE FROM reviews WHERE productId = ?').bind(id).run()
      await c.data.d1.delete(Product, id)
      return textResult({ deleted: true, id })
    },
  },
  {
    name: 'listProductReviews',
    title: 'List Product Reviews',
    description: 'List customer reviews and rating summary for a product.',
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Product ID to list reviews for.',
        },
      },
      required: ['productId'],
    },
    async handler(c, args = {}) {
      const productId = String(args.productId || '').trim()
      if (!productId) throw new Error('productId is required')
      const product = await getProduct(c, productId)
      if (!product) throw new Error(`Product "${productId}" not found`)

      const reviews = await getProductReviews(c, productId)
      return textResult({
        productId,
        summary: {
          ratingAvg: Number(product.data?.ratingAvg) || 0,
          ratingCount: Number(product.data?.ratingCount) || reviews.length,
        },
        reviews,
      })
    },
  },
  {
    name: 'createProductReview',
    title: 'Create Product Review',
    description: 'Submit or update your star rating (1-5) and review for a product.',
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Product ID to review.',
        },
        rating: {
          type: 'number',
          description: 'Star rating between 1 and 5.',
        },
        title: {
          type: 'string',
          description: 'Short review headline.',
        },
        body: {
          type: 'string',
          description: 'Detailed review comment.',
        },
      },
      required: ['productId', 'rating'],
    },
    async handler(c, args = {}) {
      assertWriteAccess(c)
      const productId = String(args.productId || '').trim()
      if (!productId) throw new Error('productId is required')
      const product = await getProduct(c, productId)
      if (!product) throw new Error(`Product "${productId}" not found`)

      const result = await upsertProductReview(c, {
        productId,
        rating: args.rating,
        title: args.title,
        body: args.body,
      })
      return textResult(result)
    },
  },
  {
    name: 'listOrders',
    title: 'List Orders',
    description: 'List orders placed by the authenticated user.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of orders to return (1-100, default: 20).',
        },
      },
    },
    async handler(c, args = {}) {
      const orders = await getUserOrders(c, { limit: args.limit || 20 })
      return textResult({ count: orders.length, orders })
    },
  },
  {
    name: 'getOrder',
    title: 'Get Order',
    description: 'Retrieve a single order owned by the authenticated user.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Order ID to retrieve.',
        },
      },
      required: ['id'],
    },
    async handler(c, args = {}) {
      const id = String(args.id || '').trim()
      if (!id) throw new Error('Order id is required')
      const order = await getUserOrder(c, id)
      if (!order) throw new Error(`Order "${id}" not found`)
      return textResult({ order })
    },
  },
  {
    name: 'createOrder',
    title: 'Create Order',
    description: 'Place an order for one or more products (decrements stock and sends order confirmation email).',
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'Items to purchase (if omitted, checks out the user’s current KV cart).',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string' },
              quantity: { type: 'number' },
            },
            required: ['productId', 'quantity'],
          },
        },
        customerName: {
          type: 'string',
          description: 'Recipient full name.',
        },
        shippingAddress: {
          type: 'string',
          description: 'Shipping address.',
        },
        notes: {
          type: 'string',
          description: 'Optional delivery notes.',
        },
      },
    },
    async handler(c, args = {}) {
      assertWriteAccess(c)
      const result = await createOrder(c, args)
      return textResult(result)
    },
  },
]

export const RESOURCES = [
  {
    uri: 'flaregun://user/me',
    name: 'Current User Profile',
    description: 'Profile information for the currently authenticated user.',
    mimeType: 'application/json',
  },
  {
    uri: 'flaregun://products',
    name: 'Products Catalog',
    description: 'Marketplace products along with your own listings.',
    mimeType: 'application/json',
  },
  {
    uri: 'flaregun://orders',
    name: 'My Orders',
    description: 'Order history for the currently authenticated user.',
    mimeType: 'application/json',
  },
]

export const RESOURCE_TEMPLATES = [
  {
    uriTemplate: 'flaregun://products/{id}',
    name: 'Product by ID',
    description: 'Retrieve a specific product record by ID.',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'flaregun://products/{id}/reviews',
    name: 'Product Reviews',
    description: 'Retrieve customer reviews and rating summary for a product.',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'flaregun://orders/{id}',
    name: 'Order by ID',
    description: 'Retrieve a specific order placed by the authenticated user.',
    mimeType: 'application/json',
  },
]

export const PROMPTS = [
  {
    name: 'summarizeCatalog',
    title: 'Summarize Product Catalog',
    description: 'Generate a summary and pricing overview of the current product catalog.',
    arguments: [
      {
        name: 'category',
        description: 'Optional category to focus on.',
        required: false,
      },
    ],
  },
]

export function listPublicTools() {
  return TOOLS.map(({ handler: _handler, ...schema }) => schema)
}

export async function executeTool(c, name, args = {}) {
  const tool = TOOLS.find((t) => t.name === name)
  if (!tool) {
    return null
  }
  return await tool.handler(c, args)
}

export async function readResource(c, uri) {
  if (uri === 'flaregun://user/me') {
    const user = (await c.data.d1.get(User, c.data.user.id)) || c.data.user
    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(
        {
          id: user.id,
          name: user.name || null,
          email: user.email || null,
          image: user.image || null,
          createdAt: user.createdAt || null,
        },
        null,
        2,
      ),
    }
  }

  if (uri === 'flaregun://products') {
    const products = await getProducts(c, { scope: 'all', limit: 50 })
    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({ products }, null, 2),
    }
  }

  if (uri === 'flaregun://orders') {
    const orders = await getUserOrders(c, { limit: 50 })
    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({ orders }, null, 2),
    }
  }

  const reviewsMatch = typeof uri === 'string' && uri.match(/^flaregun:\/\/products\/([^/]+)\/reviews$/)
  if (reviewsMatch) {
    const id = decodeURIComponent(reviewsMatch[1])
    const product = await getProduct(c, id)
    if (!product) return null
    const reviews = await getProductReviews(c, id)
    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(
        {
          productId: id,
          summary: {
            ratingAvg: Number(product.data?.ratingAvg) || 0,
            ratingCount: Number(product.data?.ratingCount) || reviews.length,
          },
          reviews,
        },
        null,
        2,
      ),
    }
  }

  const productMatch = typeof uri === 'string' && uri.match(/^flaregun:\/\/products\/([^/]+)$/)
  if (productMatch) {
    const id = decodeURIComponent(productMatch[1])
    const product = await getProduct(c, id)
    if (!product) return null
    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({ product }, null, 2),
    }
  }

  const orderMatch = typeof uri === 'string' && uri.match(/^flaregun:\/\/orders\/([^/]+)$/)
  if (orderMatch) {
    const id = decodeURIComponent(orderMatch[1])
    try {
      const order = await getUserOrder(c, id)
      if (!order) return null
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({ order }, null, 2),
      }
    } catch {
      return null
    }
  }

  return null
}

export async function getPrompt(c, name, args = {}) {
  if (name !== 'summarizeCatalog') return null
  const where = []
  if (args.category) {
    const rawCat = String(args.category).trim()
    if (rawCat) {
      const lowerCat = rawCat.toLowerCase()
      where.push(
        rawCat === lowerCat
          ? ['data.category', '=', rawCat]
          : [['data.category', '=', rawCat], 'or', ['data.category', '=', lowerCat]],
      )
    }
  }
  const products = await getProducts(c, { scope: 'all', where, limit: 50 })

  return {
    description: 'Summarize the current product catalog and highlight pricing, ratings, and stock insights.',
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Please summarize the following product catalog${args.category ? ` (filtered by category "${args.category}")` : ''} and highlight notable pricing, ratings, or inventory details:\n\n${JSON.stringify(products, null, 2)}`,
        },
      },
    ],
  }
}
