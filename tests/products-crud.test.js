import { test, expect } from 'vitest'
import { baseUrl } from './helper.js'

test('Landing page, seeded products, and authenticated CRUD flow', async () => {
  // 1. Unauthenticated Landing Page (/) renders hero, features, and recent products without a raw form on page
  const homeRes = await fetch(`${baseUrl}/`)
  expect(homeRes.status).toBe(200)
  const homeHtml = await homeRes.text()
  expect(homeHtml).toContain('Build fast, modern edge apps with Flaregun')
  expect(homeHtml).toContain('Recent Products')
  expect(homeHtml).toContain('Sign In to Get Started')
  expect(homeHtml).toContain('<product-list')
  expect(homeHtml).not.toContain('<product-form></product-form>')
  expect(homeHtml).not.toContain('can-manage')

  // 2. Seeded sample products are available publicly via GET /v1/products
  const listRes = await fetch(`${baseUrl}/v1/products`)
  expect(listRes.status).toBe(200)
  const listData = await listRes.json()
  expect(Array.isArray(listData.products)).toBe(true)
  expect(listData.products.length).toBeGreaterThanOrEqual(4)
  expect(listData.products.some((p) => p.name === 'Wireless Studio Headphones')).toBe(true)

  const sampleProduct = listData.products[0]

  // 3. Dedicated /products page and /products/:id detail page work for unauthenticated visitors
  const catalogRes = await fetch(`${baseUrl}/products`)
  expect(catalogRes.status).toBe(200)
  const catalogHtml = await catalogRes.text()
  expect(catalogHtml).toContain('Products Catalog')
  expect(catalogHtml).toContain('<product-list')
  expect(catalogHtml).not.toContain('can-manage')

  const detailRes = await fetch(`${baseUrl}/products/${sampleProduct.id}`)
  expect(detailRes.status).toBe(200)
  const detailHtml = await detailRes.text()
  expect(detailHtml).toContain(sampleProduct.name)
  expect(detailHtml).toContain('<product-detail')
  expect(detailHtml).not.toContain('can-manage')

  // 4. Unauthenticated write operations (POST, PUT, DELETE) are rejected with 401
  const unauthCreateRes = await fetch(`${baseUrl}/v1/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product: { name: 'Unauthorized Item', price: 10 },
    }),
  })
  expect(unauthCreateRes.status).toBe(401)

  const unauthUpdateRes = await fetch(`${baseUrl}/v1/products/${sampleProduct.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product: { name: 'Hacked Name' },
    }),
  })
  expect(unauthUpdateRes.status).toBe(401)

  const unauthDeleteRes = await fetch(`${baseUrl}/v1/products/${sampleProduct.id}`, {
    method: 'DELETE',
  })
  expect(unauthDeleteRes.status).toBe(401)

  // 5. Sign in user via email verification flow
  const email = `crud-user-${Date.now()}@example.com`
  const startRes = await fetch(`${baseUrl}/auth/email/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  expect(startRes.status).toBe(200)
  const startData = await startRes.json()
  expect(startData.link).toBeDefined()

  const verifyRes = await fetch(startData.link, { redirect: 'manual' })
  expect(verifyRes.status).toBe(302)
  const setCookieHeaders = verifyRes.headers.getSetCookie?.() || [verifyRes.headers.get('set-cookie')].filter(Boolean)
  const cookieHeader = setCookieHeaders.map((c) => c.split(';')[0]).join('; ')

  // 6. Authenticated Landing Page and Products Page enable management controls (can-manage)
  const authHomeRes = await fetch(`${baseUrl}/`, {
    headers: { Cookie: cookieHeader },
  })
  expect(authHomeRes.status).toBe(200)
  const authHomeHtml = await authHomeRes.text()
  expect(authHomeHtml).toContain('Welcome back,')
  expect(authHomeHtml).toContain('can-manage')

  // 7. Authenticated CREATE product (POST /v1/products)
  const createRes = await fetch(`${baseUrl}/v1/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      product: {
        name: 'Cloudflare Edge Router',
        description: 'High-throughput hardware router for edge deployments.',
        price: 299.99,
        data: {
          category: 'electronics',
          inStock: true,
          discount: 5,
        },
      },
    }),
  })
  expect(createRes.status).toBe(200)
  const createData = await createRes.json()
  expect(createData.product).toBeDefined()
  expect(createData.product.id).toBeDefined()
  expect(createData.product.name).toBe('Cloudflare Edge Router')
  expect(createData.product.price).toBe(299.99)
  expect(createData.product.data.category).toBe('electronics')
  expect(createData.product.data.createdBy).toBeDefined()

  const createdId = createData.product.id

  // 8. Authenticated UPDATE product (PUT /v1/products/:id)
  const updateRes = await fetch(`${baseUrl}/v1/products/${createdId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      product: {
        name: 'Cloudflare Edge Router Pro',
        description: 'Updated description with 10GbE ports.',
        price: 349.0,
        data: {
          category: 'electronics',
          inStock: false,
          discount: 20,
        },
      },
    }),
  })
  expect(updateRes.status).toBe(200)
  const updateData = await updateRes.json()
  expect(updateData.product.name).toBe('Cloudflare Edge Router Pro')
  expect(updateData.product.description).toBe('Updated description with 10GbE ports.')
  expect(updateData.product.price).toBe(349.0)
  expect(updateData.product.data.inStock).toBe(false)
  expect(updateData.product.data.discount).toBe(20)

  // 9. READ single product (GET /v1/products/:id) as owner
  const getOneRes = await fetch(`${baseUrl}/v1/products/${createdId}`, {
    headers: { Cookie: cookieHeader },
  })
  expect(getOneRes.status).toBe(200)
  const getOneData = await getOneRes.json()
  expect(getOneData.product.name).toBe('Cloudflare Edge Router Pro')

  // 9b. Per-user isolation: unauthenticated and other users cannot view, update, or delete User 1's product
  const unauthGetPrivateRes = await fetch(`${baseUrl}/v1/products/${createdId}`)
  expect(unauthGetPrivateRes.status).toBe(404)

  // User 1 cannot update or delete public sample products
  const updateSampleRes = await fetch(`${baseUrl}/v1/products/${sampleProduct.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ product: { name: 'Overwrite Sample' } }),
  })
  expect(updateSampleRes.status).toBe(403)

  // Sign in a second user and verify their product list is separate
  const email2 = `crud-user2-${Date.now()}@example.com`
  const startRes2 = await fetch(`${baseUrl}/auth/email/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email2 }),
  })
  const startData2 = await startRes2.json()
  const verifyRes2 = await fetch(startData2.link, { redirect: 'manual' })
  const setCookieHeaders2 = verifyRes2.headers.getSetCookie?.() || [verifyRes2.headers.get('set-cookie')].filter(Boolean)
  const cookieHeader2 = setCookieHeaders2.map((c) => c.split(';')[0]).join('; ')

  const user2ListRes = await fetch(`${baseUrl}/v1/products`, {
    headers: { Cookie: cookieHeader2 },
  })
  expect(user2ListRes.status).toBe(200)
  const user2ListData = await user2ListRes.json()
  expect(user2ListData.products).toEqual([])

  const user2UpdateUser1Res = await fetch(`${baseUrl}/v1/products/${createdId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader2,
    },
    body: JSON.stringify({ product: { name: 'Hijacked' } }),
  })
  expect(user2UpdateUser1Res.status).toBe(403)

  const user2DeleteUser1Res = await fetch(`${baseUrl}/v1/products/${createdId}`, {
    method: 'DELETE',
    headers: { Cookie: cookieHeader2 },
  })
  expect(user2DeleteUser1Res.status).toBe(403)

  // 10. Authenticated DELETE product (DELETE /v1/products/:id)
  const deleteRes = await fetch(`${baseUrl}/v1/products/${createdId}`, {
    method: 'DELETE',
    headers: { Cookie: cookieHeader },
  })
  expect(deleteRes.status).toBe(200)

  const getDeletedRes = await fetch(`${baseUrl}/v1/products/${createdId}`, {
    headers: { Cookie: cookieHeader },
  })
  expect(getDeletedRes.status).toBe(404)
})
