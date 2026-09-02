import { test, expect } from 'vitest'

test('Settings page and Avatar menu integration tests', async () => {
  const baseURL = 'http://localhost:8787'

  // 1. Unauthenticated request to /settings redirects to signin
  const unauthRes = await fetch(`${baseURL}/settings`, { redirect: 'manual' })
  expect(unauthRes.status).toBe(302)
  expect(unauthRes.headers.get('location')).toBe('/signin?redirect=/settings')

  // 2. Authenticate user via email magic link flow
  const email = `test-${Date.now()}@example.com`
  const startRes = await fetch(`${baseURL}/auth/email/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  expect(startRes.status).toBe(200)
  const startData = await startRes.json()
  expect(startData.link).toBeDefined()

  // Follow the verification link to obtain auth session cookies
  const verifyRes = await fetch(startData.link, { redirect: 'manual' })
  expect(verifyRes.status).toBe(302)

  const setCookieHeaders = verifyRes.headers.getSetCookie?.() || [verifyRes.headers.get('set-cookie')].filter(Boolean)
  const cookieHeader = setCookieHeaders.map((c) => c.split(';')[0]).join('; ')
  expect(cookieHeader).toContain('session=')
  expect(cookieHeader).toContain('userId=')

  // 3. Authenticated request to /settings returns 200 with settings-page component
  const settingsRes = await fetch(`${baseURL}/settings`, {
    headers: { Cookie: cookieHeader },
  })
  expect(settingsRes.status).toBe(200)
  const settingsHtml = await settingsRes.text()
  expect(settingsHtml).toContain('Settings - Flaregun')
  expect(settingsHtml).toContain('<settings-page')
  expect(settingsHtml).toContain('<avatar-menu')
  expect(settingsHtml).toContain('/components/settings-page.js')
  expect(settingsHtml).toContain('/components/avatar-menu.js')

  // 4. Update full name (user.name) via /v1/users/me
  const updateRes = await fetch(`${baseURL}/v1/users/me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ name: 'Jane Antigravity' }),
  })
  expect(updateRes.status).toBe(200)
  const updateData = await updateRes.json()
  expect(updateData.user).toBeDefined()
  expect(updateData.user.name).toBe('Jane Antigravity')

  // 5. Get current user profile via /v1/users/me
  const meRes = await fetch(`${baseURL}/v1/users/me`, {
    headers: { Cookie: cookieHeader },
  })
  expect(meRes.status).toBe(200)
  const meData = await meRes.json()
  expect(meData.user.name).toBe('Jane Antigravity')
  expect(meData.user.email).toBe(email)
  expect(meData.user.id).not.toBe(email)
  expect(meData.user.id.length).toBeGreaterThanOrEqual(10)

  // 6. Upload avatar image to R2 under users/{userId}/...
  const samplePng = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49,
    0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00,
    0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ])
  const formData = new FormData()
  const file = new File([samplePng], 'avatar.png', { type: 'image/png' })
  formData.append('file', file)

  const uploadRes = await fetch(`${baseURL}/v1/users/avatar`, {
    method: 'POST',
    headers: {
      Cookie: cookieHeader,
    },
    body: formData,
  })
  expect(uploadRes.status).toBe(200)
  const uploadData = await uploadRes.json()
  expect(uploadData.success).toBe(true)
  expect(uploadData.image).toMatch(/^\/r2\/users\/[^/]+\/avatar-[^/]+\.png$/)
  expect(uploadData.user.image).toBe(uploadData.image)

  // Verify avatar image can be retrieved from R2 endpoint
  const r2Res = await fetch(`${baseURL}${uploadData.image}`)
  expect(r2Res.status).toBe(200)
  expect(r2Res.headers.get('content-type')).toBe('image/png')
  const r2Buffer = await r2Res.arrayBuffer()
  expect(r2Buffer.byteLength).toBe(samplePng.byteLength)

  // 6b. Upload AVIF avatar image to R2
  const sampleAvif = new Uint8Array([0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66])
  const avifFormData = new FormData()
  const avifFile = new File([sampleAvif], 'avatar.avif', { type: 'image/avif' })
  avifFormData.append('file', avifFile)

  const avifUploadRes = await fetch(`${baseURL}/v1/users/avatar`, {
    method: 'POST',
    headers: {
      Cookie: cookieHeader,
    },
    body: avifFormData,
  })
  expect(avifUploadRes.status).toBe(200)
  const avifUploadData = await avifUploadRes.json()
  expect(avifUploadData.success).toBe(true)
  expect(avifUploadData.image).toMatch(/^\/r2\/users\/[^/]+\/avatar-[^/]+\.avif$/)

  const avifR2Res = await fetch(`${baseURL}${avifUploadData.image}`)
  expect(avifR2Res.status).toBe(200)
  expect(avifR2Res.headers.get('content-type')).toBe('image/avif')

  // 7. Passkeys listing and deletion endpoints
  const listPasskeysRes = await fetch(`${baseURL}/auth/passkeys/list`, {
    headers: { Cookie: cookieHeader },
  })
  expect(listPasskeysRes.status).toBe(200)
  const listPasskeysData = await listPasskeysRes.json()
  expect(Array.isArray(listPasskeysData.passkeys)).toBe(true)

  // Test passkey delete endpoint with non-existent ID (should return 404)
  const deletePasskeyRes = await fetch(`${baseURL}/auth/passkeys/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ id: 'non-existent-pk-id' }),
  })
  expect(deletePasskeyRes.status).toBe(404)
  const deletePasskeyData = await deletePasskeyRes.json()
  expect(deletePasskeyData.error).toBeDefined()

  // 8. Remove avatar
  const removeAvatarRes = await fetch(`${baseURL}/v1/users/avatar`, {
    method: 'DELETE',
    headers: { Cookie: cookieHeader },
  })
  expect(removeAvatarRes.status).toBe(200)
  const removeAvatarData = await removeAvatarRes.json()
  expect(removeAvatarData.success).toBe(true)
  expect(removeAvatarData.user.image).toBeNull()

  // 9. Signout endpoint clears cookies and redirects home
  const signoutRes = await fetch(`${baseURL}/signout`, { redirect: 'manual' })
  expect(signoutRes.status).toBe(302)
  expect(signoutRes.headers.get('location')).toBe('/')
})
