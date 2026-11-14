import { hasApiKeyScope } from '../data/apiKeys.js'
import { Product, getProduct } from '../data/products.js'
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
        scopes: c.data.apiKey?.scopes || ['mcp', 'read', 'write'],
      })
    },
  },
  {
    name: 'listProducts',
    title: 'List Products',
    description: 'List products in the catalog with optional search, category, stock, and ownership filters.',
    inputSchema: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          enum: ['all', 'mine', 'sample'],
          description:
            'Which products to return: "mine" (owned by you), "sample" (public seeded items), or "all" (default: "all").',
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
      const scope = args.scope || 'all'
      const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 100)
      const userId = c.data.user.id

      let where
      if (scope === 'mine') {
        where = { userId }
      } else if (scope === 'sample') {
        where = { userId: null }
      } else {
        where = [[['userId', '=', userId], 'or', ['userId', 'is', null]]]
      }

      let products = await c.data.d1.query(Product, {
        where,
        order: [['createdAt', 'desc']],
        limit: 100,
      })

      if (args.category) {
        const cat = String(args.category).trim().toLowerCase()
        products = products.filter((p) => String(p.data?.category || '').toLowerCase() === cat)
      }

      if (typeof args.inStock === 'boolean') {
        products = products.filter((p) => Boolean(p.data?.inStock) === args.inStock)
      }

      if (args.search) {
        const q = String(args.search).trim().toLowerCase()
        products = products.filter(
          (p) =>
            String(p.name || '')
              .toLowerCase()
              .includes(q) ||
            String(p.description || '')
              .toLowerCase()
              .includes(q),
        )
      }

      products = products.slice(0, limit)
      return textResult({
        count: products.length,
        products,
      })
    },
  },
  {
    name: 'getProduct',
    title: 'Get Product',
    description: 'Retrieve a single product by ID.',
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
    description: 'Create a new product owned by the authenticated user.',
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
        discount: {
          type: 'number',
          description: 'Optional discount percentage (0-100).',
        },
      },
      required: ['name'],
    },
    async handler(c, args = {}) {
      assertWriteAccess(c)
      const name = String(args.name || '').trim()
      if (!name) throw new Error('Product name is required')

      const record = {
        userId: c.data.user.id,
        name,
        description: args.description !== undefined ? String(args.description).trim() : '',
        price: Number(args.price) || 0,
        data: {
          category: args.category ? String(args.category).trim() : 'general',
          inStock: args.inStock !== undefined ? Boolean(args.inStock) : true,
          discount: Number(args.discount) || 0,
          createdBy: c.data.user.id,
        },
      }

      await c.data.d1.insert(Product, record)
      const created = await c.data.d1.get(Product, record.id)
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
        discount: {
          type: 'number',
          description: 'Updated discount percentage.',
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
      if (args.price !== undefined) updates.price = Number(args.price) || 0

      if (args.category !== undefined || args.inStock !== undefined || args.discount !== undefined) {
        updates.data = {
          ...(existing.data || {}),
          ...(args.category !== undefined ? { category: String(args.category).trim() } : {}),
          ...(args.inStock !== undefined ? { inStock: Boolean(args.inStock) } : {}),
          ...(args.discount !== undefined ? { discount: Number(args.discount) || 0 } : {}),
          createdBy: existing.data?.createdBy || c.data.user.id,
          updatedBy: c.data.user.id,
        }
      }

      await c.data.d1.update(Product, id, updates)
      const product = await c.data.d1.get(Product, id)
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

      await c.data.d1.delete(Product, id)
      return textResult({ deleted: true, id })
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
    description: 'Products owned by the authenticated user along with public sample products.',
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
    const userId = c.data.user.id
    const products = await c.data.d1.query(Product, {
      where: [[['userId', '=', userId], 'or', ['userId', 'is', null]]],
      order: [['createdAt', 'desc']],
      limit: 50,
    })
    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({ products }, null, 2),
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

  return null
}

export async function getPrompt(c, name, args = {}) {
  if (name !== 'summarizeCatalog') return null
  const userId = c.data.user.id
  let products = await c.data.d1.query(Product, {
    where: [[['userId', '=', userId], 'or', ['userId', 'is', null]]],
    order: [['createdAt', 'desc']],
    limit: 50,
  })
  if (args.category) {
    const cat = String(args.category).trim().toLowerCase()
    products = products.filter((p) => String(p.data?.category || '').toLowerCase() === cat)
  }

  return {
    description: 'Summarize the current product catalog and highlight pricing and stock insights.',
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Please summarize the following product catalog${args.category ? ` (filtered by category "${args.category}")` : ''} and highlight notable pricing or inventory details:\n\n${JSON.stringify(products, null, 2)}`,
        },
      },
    ],
  }
}
