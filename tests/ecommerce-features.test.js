import { test, expect } from 'vitest'
import { baseUrl } from './helper.js'

async function signInUser(prefix = 'shop-user', displayName = '') {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`
  const startRes = await fetch(`${baseUrl}/auth/email/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  expect(startRes.status).toBe(200)
  const { link } = await startRes.json()

  const verifyRes = await fetch(link, { redirect: 'manual' })
  expect(verifyRes.status).toBe(302)
  const setCookieHeaders = verifyRes.headers.getSetCookie?.() || [verifyRes.headers.get('set-cookie')].filter(Boolean)
  const cookie = setCookieHeaders.map((sc) => sc.split(';')[0]).join('; ')

  if (displayName) {
    await fetch(`${baseUrl}/v1/users/me`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ user: { name: displayName } }),
    })
  }

  const meRes = await fetch(`${baseUrl}/v1/users/me`, { headers: { Cookie: cookie } })
  const { user } = await meRes.json()
  return { email, cookie, user }
}

// 1x1 transparent PNG
const TINY_PNG_BYTES = Uint8Array.from(
  Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
)

test('R2 product image upload, validation, and product attachment', async () => {
  const unauthForm = new FormData()
  unauthForm.append('file', new Blob([TINY_PNG_BYTES], { type: 'image/png' }), 'photo.png')
  const unauthRes = await fetch(`${baseUrl}/v1/products/image`, {
    method: 'POST',
    body: unauthForm,
  })
  expect(unauthRes.status).toBe(401)

  const seller = await signInUser('r2-seller', 'Alice Maker')

  // Reject non-image file types
  const badForm = new FormData()
  badForm.append('file', new Blob(['not an image'], { type: 'text/plain' }), 'notes.txt')
  const badRes = await fetch(`${baseUrl}/v1/products/image`, {
    method: 'POST',
    headers: { Cookie: seller.cookie },
    body: badForm,
  })
  expect(badRes.status).toBe(400)

  // Upload valid PNG to R2
  const goodForm = new FormData()
  goodForm.append('file', new Blob([TINY_PNG_BYTES], { type: 'image/png' }), 'camera.png')
  const uploadRes = await fetch(`${baseUrl}/v1/products/image`, {
    method: 'POST',
    headers: { Cookie: seller.cookie },
    body: goodForm,
  })
  expect(uploadRes.status).toBe(200)
  const uploadData = await uploadRes.json()
  expect(uploadData.success).toBe(true)
  expect(uploadData.image).toMatch(/^\/r2\/products\//)

  // Verify R2 serves the uploaded image bytes cleanly
  const serveRes = await fetch(`${baseUrl}${uploadData.image}`)
  expect(serveRes.status).toBe(200)
  expect(serveRes.headers.get('content-type')).toBe('image/png')
  const servedBuf = new Uint8Array(await serveRes.arrayBuffer())
  expect(servedBuf.byteLength).toBe(TINY_PNG_BYTES.byteLength)

  // Create product with R2 image and verify seller attribution
  const createRes = await fetch(`${baseUrl}/v1/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: seller.cookie },
    body: JSON.stringify({
      product: {
        name: 'Mirrorless Edge Camera',
        description: 'Compact 4K camera stored with R2 product photography.',
        price: 599,
        image: uploadData.image,
        data: { category: 'electronics', inStock: true, stockCount: 6, discount: 10 },
      },
    }),
  })
  expect(createRes.status).toBe(200)
  const { product } = await createRes.json()
  expect(product.image).toBe(uploadData.image)
  expect(product.seller).toEqual({
    id: seller.user.id,
    name: 'Alice Maker',
    image: null,
  })
})

test('Product reviews, star rating aggregation, upsert, and ownership checks', async () => {
  const seller = await signInUser('rev-seller', 'Seller One')
  const reviewer1 = await signInUser('rev-buyer1', 'Buyer One')
  const reviewer2 = await signInUser('rev-buyer2', 'Buyer Two')

  // Seeded products already carry seeded ratings & reviews
  const catalogRes = await fetch(`${baseUrl}/v1/products`)
  const { products } = await catalogRes.json()
  const headphones = products.find((p) => p.name === 'Wireless Studio Headphones')
  expect(headphones).toBeDefined()
  expect(headphones.image).toBe('/images/products/headphones.svg')
  expect(headphones.data.ratingCount).toBeGreaterThanOrEqual(2)
  expect(headphones.data.ratingAvg).toBeGreaterThanOrEqual(4)

  // Create a fresh product to test review math cleanly
  const prodRes = await fetch(`${baseUrl}/v1/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: seller.cookie },
    body: JSON.stringify({
      product: {
        name: 'Artisan Espresso Tamper',
        price: 55,
        data: { category: 'home', inStock: true, stockCount: 10 },
      },
    }),
  })
  const { product } = await prodRes.json()

  // Unauthenticated review creation is rejected
  const unauthRev = await fetch(`${baseUrl}/v1/products/${product.id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating: 5, body: 'Should fail' }),
  })
  expect(unauthRev.status).toBe(401)

  // Out-of-range rating is rejected
  const invalidRev = await fetch(`${baseUrl}/v1/products/${product.id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: reviewer1.cookie },
    body: JSON.stringify({ rating: 6, body: 'Too many stars' }),
  })
  expect(invalidRev.status).toBe(400)

  // Reviewer 1 posts 5 stars, Reviewer 2 posts 3 stars -> avg = 4.0, count = 2
  const rev1Res = await fetch(`${baseUrl}/v1/products/${product.id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: reviewer1.cookie },
    body: JSON.stringify({ rating: 5, title: 'Heavy & precise', body: 'Perfect 58.5mm fit.' }),
  })
  expect(rev1Res.status).toBe(201)
  const rev1Data = await rev1Res.json()
  expect(rev1Data.review.author.name).toBe('Buyer One')

  const rev2Res = await fetch(`${baseUrl}/v1/products/${product.id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: reviewer2.cookie },
    body: JSON.stringify({ rating: 3, title: 'Solid', body: 'Handle is slightly tall for small hands.' }),
  })
  expect(rev2Res.status).toBe(201)
  const rev2Data = await rev2Res.json()
  expect(rev2Data.summary).toEqual({ ratingAvg: 4, ratingCount: 2 })

  // Reviewer 2 updates their review to 4 stars -> upserts cleanly (count stays 2, avg becomes 4.5)
  const rev2UpdateRes = await fetch(`${baseUrl}/v1/products/${product.id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: reviewer2.cookie },
    body: JSON.stringify({ rating: 4, title: 'Grew on me', body: 'Great workflow once dialed in.' }),
  })
  expect(rev2UpdateRes.status).toBe(200)
  const rev2UpdateData = await rev2UpdateRes.json()
  expect(rev2UpdateData.updatedExisting).toBe(true)
  expect(rev2UpdateData.summary).toEqual({ ratingAvg: 4.5, ratingCount: 2 })

  // Seller cannot delete Reviewer 1's review (403)
  const forbiddenDel = await fetch(`${baseUrl}/v1/reviews/${rev1Data.review.id}`, {
    method: 'DELETE',
    headers: { Cookie: seller.cookie },
  })
  expect(forbiddenDel.status).toBe(403)

  // Reviewer 2 deletes their own review -> count = 1, avg = 5
  const delRes = await fetch(`${baseUrl}/v1/reviews/${rev2Data.review.id}`, {
    method: 'DELETE',
    headers: { Cookie: reviewer2.cookie },
  })
  expect(delRes.status).toBe(200)
  const delData = await delRes.json()
  expect(delData.summary).toEqual({ ratingAvg: 5, ratingCount: 1 })
})

test('KV guest cart, automatic sign-in merge, checkout Order creation, stock decrement, and mailer receipt', async () => {
  const seller = await signInUser('cart-seller', 'Gear Studio')

  // Create a discounted product with 4 units in stock ($100 with 20% off => $80 final unit price)
  const createRes = await fetch(`${baseUrl}/v1/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: seller.cookie },
    body: JSON.stringify({
      product: {
        name: 'USB-C Dock 10Gbps',
        price: 100,
        data: { category: 'electronics', inStock: true, stockCount: 4, discount: 20 },
      },
    }),
  })
  const { product: dock } = await createRes.json()

  // Out-of-stock seeded item cannot be added to cart
  const catalogRes = await fetch(`${baseUrl}/v1/products`)
  const { products } = await catalogRes.json()
  const outOfStockMat = products.find((p) => p.name === 'Minimalist Desk Mat')
  expect(outOfStockMat).toBeDefined()

  const oosCartRes = await fetch(`${baseUrl}/v1/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: outOfStockMat.id, quantity: 1 }),
  })
  expect(oosCartRes.status).toBe(400)

  // 1. Guest adds 2 docks to KV cart and receives fg_cart cookie
  const guestAddRes = await fetch(`${baseUrl}/v1/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: dock.id, quantity: 2 }),
  })
  expect(guestAddRes.status).toBe(200)
  const guestCookies = guestAddRes.headers.getSetCookie?.() || [guestAddRes.headers.get('set-cookie')].filter(Boolean)
  const guestCartCookie = guestCookies.map((c) => c.split(';')[0]).join('; ')
  expect(guestCartCookie).toContain('fg_cart=')

  const guestCartData = await guestAddRes.json()
  expect(guestCartData.cart.itemCount).toBe(2)
  expect(guestCartData.cart.subtotal).toBe(200)
  expect(guestCartData.cart.discountTotal).toBe(40)
  expect(guestCartData.cart.total).toBe(160)

  // Guest cannot checkout without signing in (401)
  const unauthOrderRes = await fetch(`${baseUrl}/v1/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: guestCartCookie },
    body: JSON.stringify({ shippingAddress: '123 Main St' }),
  })
  expect(unauthOrderRes.status).toBe(401)

  // 2. Guest signs in; sending both session cookie + fg_cart cookie merges guest KV cart into user KV cart
  const buyer = await signInUser('cart-buyer', 'Dana Shopper')
  const combinedCookie = `${buyer.cookie}; ${guestCartCookie}`

  const mergedCartRes = await fetch(`${baseUrl}/v1/cart`, {
    headers: { Cookie: combinedCookie },
  })
  expect(mergedCartRes.status).toBe(200)
  const mergedCartData = await mergedCartRes.json()
  expect(mergedCartData.cart.itemCount).toBe(2)
  expect(mergedCartData.cart.total).toBe(160)

  // Update quantity to 3 via PUT /v1/cart using only session cookie (proving cart is persisted under user KV key)
  const updateCartRes = await fetch(`${baseUrl}/v1/cart`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: buyer.cookie },
    body: JSON.stringify({ productId: dock.id, quantity: 3 }),
  })
  expect(updateCartRes.status).toBe(200)
  const updatedCartData = await updateCartRes.json()
  expect(updatedCartData.cart.itemCount).toBe(3)
  expect(updatedCartData.cart.total).toBe(240)

  // 3. Checkout creates Order, clears cart, sends confirmation email, and decrements product stockCount (4 -> 1)
  const checkoutRes = await fetch(`${baseUrl}/v1/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: buyer.cookie },
    body: JSON.stringify({
      order: {
        customerName: 'Dana Shopper',
        shippingAddress: '742 Evergreen Terrace, Springfield',
        notes: 'Ring bell',
      },
    }),
  })
  expect(checkoutRes.status).toBe(201)
  const checkoutData = await checkoutRes.json()
  expect(checkoutData.emailSent).toBe(true)
  expect(checkoutData.order.orderNumber).toMatch(/^FG-/)
  expect(checkoutData.order.total).toBe(240)
  expect(checkoutData.order.items.length).toBe(1)
  expect(checkoutData.order.items[0].quantity).toBe(3)

  // Cart is now empty
  const afterCartRes = await fetch(`${baseUrl}/v1/cart`, { headers: { Cookie: buyer.cookie } })
  expect((await afterCartRes.json()).cart.itemCount).toBe(0)

  // Product stockCount decremented from 4 to 1
  const afterProdRes = await fetch(`${baseUrl}/v1/products/${dock.id}`)
  const { product: updatedDock } = await afterProdRes.json()
  expect(updatedDock.data.stockCount).toBe(1)
  expect(updatedDock.data.inStock).toBe(true)

  // Order appears in buyer's order history, and seller cannot read buyer's order (403)
  const ordersListRes = await fetch(`${baseUrl}/v1/orders`, { headers: { Cookie: buyer.cookie } })
  expect(ordersListRes.status).toBe(200)
  const { orders } = await ordersListRes.json()
  expect(orders.some((o) => o.id === checkoutData.order.id)).toBe(true)

  const forbiddenOrderRes = await fetch(`${baseUrl}/v1/orders/${checkoutData.order.id}`, {
    headers: { Cookie: seller.cookie },
  })
  expect(forbiddenOrderRes.status).toBe(403)
})

test('Marketplace UI components and /orders route use Material 3 Web Components', async () => {
  const ordersPageRes = await fetch(`${baseUrl}/orders`)
  expect(ordersPageRes.status).toBe(200)
  const ordersHtml = await ordersPageRes.text()
  expect(ordersHtml).toContain('<orders-page')
  expect(ordersHtml).toContain('<cart-button')

  const cartJs = await (await fetch(`${baseUrl}/components/cart-drawer.js`)).text()
  expect(cartJs).toContain("customElements.define('cart-button', CartButton)")
  expect(cartJs).toContain('<md-dialog')
  expect(cartJs).toContain('<md-badge')

  const reviewsJs = await (await fetch(`${baseUrl}/components/product-reviews.js`)).text()
  expect(reviewsJs).toContain("customElements.define('product-reviews', ProductReviews)")
  expect(reviewsJs).toContain('<md-radio')
  expect(reviewsJs).toContain('<fieldset')
})
