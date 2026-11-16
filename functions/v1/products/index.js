import { Product, getProduct, getProducts, resolveProductStatus } from '../../data/products.js'

function sanitizeProductImage(value) {
  if (value === null || value === '') return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/r2/products/') || trimmed.startsWith('/images/')) {
    return trimmed
  }
  return undefined
}

export async function onRequestGet(c) {
  const url = new URL(c.request.url)
  const rawScope = url.searchParams.get('scope')
  const scope = ['all', 'mine', 'sample'].includes(rawScope) ? rawScope : 'all'
  const category = url.searchParams.get('category')?.trim()

  const where = []
  if (category) {
    where.push(['data.category', '=', category.toLowerCase()])
  }

  const products = await getProducts(c, { scope, where })
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

  const image = sanitizeProductImage(product.image ?? product.data?.image)
  const published = product.data?.published !== false && product.status !== 'draft'
  const rawStockCount = product.data?.stockCount
  const stockCount =
    rawStockCount !== undefined && rawStockCount !== null && rawStockCount !== ''
      ? Math.max(0, Math.floor(Number(rawStockCount) || 0))
      : undefined
  const inStock =
    stockCount !== undefined ? stockCount > 0 && product.data?.inStock !== false : product.data?.inStock !== false

  const record = {
    userId: c.data.user.id,
    status: resolveProductStatus(product, 'active'),
    name: String(product.name).trim(),
    description: product.description ? String(product.description).trim() : '',
    price: Math.max(0, Number(product.price) || 0),
    ...(image !== undefined ? { image } : {}),
    data: {
      ...(product.data || {}),
      category: product.data?.category ? String(product.data.category).trim().toLowerCase() : 'electronics',
      inStock,
      ...(stockCount !== undefined ? { stockCount } : {}),
      discount: Math.min(Math.max(Number(product.data?.discount) || 0, 0), 99),
      published,
      createdBy: c.data.user.id,
    },
  }

  await c.data.d1.insert(Product, record)
  const created = (await getProduct(c, record.id)) || record
  return Response.json({ product: created })
}
