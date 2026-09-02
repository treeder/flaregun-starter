import { APIError } from 'api'
import { User } from '../../../data/users.js'

export async function onRequestGet(c) {
  let userId = c.params.user
  if (!c.data.user || c.data.user.id !== userId) {
    throw new APIError('Forbidden', { status: 403 })
  }
  let user = await c.data.d1.get(User, userId)
  return Response.json({ user })
}
export async function onRequestPost(c) {
  let input = await c.request.json()
  let user = input.user
  if (!c.data.user || !user || c.data.user.id !== user.id) {
    throw new APIError('Forbidden', { status: 403 })
  }
  await c.data.d1.insert(User, user)
  return Response.json({ user })
}
