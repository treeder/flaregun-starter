import { assert } from 'testkit'

export async function test1(c) {
  let user = {
    name: 'John Wick',
    email: 'john@wick.com',
  }
  let r = await c.api.fetch(`/v1/users`, {
    method: 'POST',
    body: { user },
  })
  console.log('r:', r)
  assert(r.user)
  assert(r.user.name == user.name, 'name did not match')
  r = await c.api.fetch(`/v1/users/${r.user.id}`)
  console.log('r2:', r)
  assert(r.user)
  assert(r.user.name == user.name, 'name did not match')
}
