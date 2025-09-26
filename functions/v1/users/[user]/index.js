import { User } from '../../../data/users.js'

export async function onRequestGet(c) {
  let userId = c.params.user
  let user = await c.data.d1.get(User, userId)
  return Response.json({ user })
}
export async function onRequestPost(c) {
  let input = await c.request.json()
  let user = input.user
  await c.data.d1.insert(User, user)
  return Response.json({ user })
}
