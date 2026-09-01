import { test, expect } from 'vitest'
import { c } from './helper.js'

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
  const res = await fetch('http://localhost:8787/signin')
  expect(res.status).toBe(200)
  const html = await res.text()
  expect(html).toContain('Sign In - Flaregun')
  expect(html).toContain('flex col aic jcc')
  expect(html).toContain('/components/sign-in.js')
  expect(html).toContain('<sign-in baseURL="/auth" afterLoginHref="/"></sign-in>')

  const compRes = await fetch('http://localhost:8787/components/sign-in.js')
  expect(compRes.status).toBe(200)
  const compCode = await compRes.text()
  expect(compCode).toContain("customElements.define('sign-in', SignIn)")
  expect(compCode).toContain('md-card')
})
