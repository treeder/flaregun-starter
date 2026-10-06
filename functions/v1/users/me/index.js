import { APIError } from 'api'
import { User } from '../../../data/users.js'

export async function onRequestGet(c) {
  if (!c.data.user) throw new APIError('Unauthorized', { status: 401 })
  const user = await c.data.d1.get(User, c.data.user.id)
  return Response.json({ user: user || c.data.user })
}

export async function onRequestPut(c) {
  return await handleUpdate(c)
}

export async function onRequestPatch(c) {
  return await handleUpdate(c)
}

export async function onRequestPost(c) {
  return await handleUpdate(c)
}

async function handleUpdate(c) {
  if (!c.data.user) throw new APIError('Unauthorized', { status: 401 })
  const input = await c.request.json()
  const user = input?.user
  if (!user || typeof user !== 'object' || Array.isArray(user)) {
    throw new APIError('Bad Request: user payload required', { status: 400 })
  }
  const updates = {}
  if (user.name !== undefined) updates.name = user.name
  if (user.image !== undefined) updates.image = user.image
  if (user.age !== undefined) updates.age = user.age
  if (user.data !== undefined) updates.data = user.data

  const existing = await c.data.d1.get(User, c.data.user.id)
  if (!existing) {
    await c.data.d1.insert(User, {
      id: c.data.user.id,
      email: c.data.user.email,
      ...updates,
    })
  } else {
    await c.data.d1.update(User, c.data.user.id, updates)
  }

  const updated = await c.data.d1.get(User, c.data.user.id)
  return Response.json({ user: updated })
}
