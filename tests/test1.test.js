import { test, expect } from 'vitest'
import { c, baseUrl } from './helper.js'

test('test1', async () => {
  let user = {
    name: 'John Wick',
    email: 'john@wick.com',
  }
  let r = await c.api.fetch(`/v1/users`, {
    method: 'POST',
    body: { user },
  })
  console.log('r:', r)
  expect(r.user).toBeDefined()
  expect(r.user.name).toBe(user.name)
  r = await c.api.fetch(`/v1/users/${r.user.id}`)
  console.log('r2:', r)
  expect(r.user).toBeDefined()
  expect(r.user.name).toBe(user.name)
})

test('signin page renders centered layout and starter component', async () => {
  const res = await fetch(`${baseUrl}/signin`)
  expect(res.status).toBe(200)
  const html = await res.text()
  expect(html).toContain('Sign In - Flaregun')
  expect(html).toContain('flex col aic jcc')
  expect(html).toContain('/components/sign-in.js')
  expect(html).toContain('<sign-in baseURL="/auth" afterLoginHref="/"></sign-in>')

  const compRes = await fetch(`${baseUrl}/components/sign-in.js`)
  expect(compRes.status).toBe(200)
  const compCode = await compRes.text()
  expect(compCode).toContain("customElements.define('sign-in', SignIn)")
  expect(compCode).toContain('md-card')
})

test('styles define white card on off-white background', async () => {
  const cssRes = await fetch(`${baseUrl}/css/styles.css`)
  expect(cssRes.status).toBe(200)
  const cssText = await cssRes.text()
  expect(cssText).toContain('--md-card-container-color')
  expect(cssText).toContain('md-card')

  const lightRes = await fetch(`${baseUrl}/css/light.css`)
  expect(lightRes.status).toBe(200)
  const lightText = await lightRes.text()
  expect(lightText).toContain('--md-sys-color-background: #f8f9fa')
  expect(lightText).toContain('--md-sys-color-surface: #ffffff')
  expect(lightText).toContain('--md-card-container-color: #ffffff')

  const darkRes = await fetch(`${baseUrl}/css/dark.css`)
  expect(darkRes.status).toBe(200)
  const darkText = await darkRes.text()
  expect(darkText).toContain('--md-card-container-color: rgb(18 18 18)')
})

test('navbar includes padding for demo', async () => {
  const res = await fetch(`${baseUrl}/`)
  expect(res.status).toBe(200)
  const html = await res.text()
  expect(html).toMatch(/class="[^"]*topnav[^"]*p16[^"]*"/)

  const cssRes = await fetch(`${baseUrl}/css/styles.css`)
  expect(cssRes.status).toBe(200)
  const cssText = await cssRes.text()
  expect(cssText).toMatch(/\.topnav\s*\{[^}]*padding:\s*16px;/)
})

