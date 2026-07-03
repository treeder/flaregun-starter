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
