// Define your models as classes with a static properties attribute:
export class Product {
  static properties = {
    id: {
      type: String,
      primaryKey: true,
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
    data: {
      type: Object, // this will be stored as a JSON object so you can stuff anything in here and still query on it.
    },
  }
}

export const SAMPLE_PRODUCTS = [
  {
    name: 'Wireless Studio Headphones',
    description: 'Active noise-canceling over-ear headphones with 40-hour battery life and spatial audio.',
    price: 249.99,
    data: {
      category: 'electronics',
      inStock: true,
      discount: 15,
    },
  },
  {
    name: 'Mechanical Split Keyboard',
    description: 'Hot-swappable ergonomic mechanical keyboard with custom tactile switches and RGB underglow.',
    price: 179.0,
    data: {
      category: 'electronics',
      inStock: true,
      discount: 0,
    },
  },
  {
    name: 'Cloudflare Edge Architecture Guide',
    description: 'Comprehensive handbook on building globally distributed applications with Workers, D1, R2, and KV.',
    price: 39.5,
    data: {
      category: 'books',
      inStock: true,
      discount: 10,
    },
  },
  {
    name: 'Minimalist Desk Mat',
    description: 'Water-resistant merino wool felt and vegan leather desk pad for a clean workspace.',
    price: 45.0,
    data: {
      category: 'accessories',
      inStock: false,
      discount: 0,
    },
  },
]

export async function seedProducts(c) {
  if (!c?.data?.d1) return
  try {
    const count = await c.data.d1.count(Product)
    if (count === 0) {
      for (const item of SAMPLE_PRODUCTS) {
        await c.data.d1.insert(Product, { ...item })
      }
    }
  } catch (err) {
    c.data?.logger?.error?.('Failed to seed products', err)
  }
}

export async function getProducts(c, q = {}) {
  const query = {
    order: ['createdAt', 'desc'],
    ...q,
  }
  return await c.data.d1.query(Product, query)
}

export async function getProduct(c, id) {
  return await c.data.d1.get(Product, id)
}
