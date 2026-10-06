import { APIError } from 'api'
import { User } from '../../../data/users.js'

export async function onRequestGet(c) {
  if (!c.data.user) throw new APIError('Unauthorized', { status: 401 })
  const user = await c.data.d1.get(User, c.data.user.id)
  const userData = user?.data || c.data.user.data || {}
  const flags = Array.isArray(userData.flags)
    ? userData.flags
    : userData.flags && typeof userData.flags === 'object'
      ? Object.keys(userData.flags).filter((k) => userData.flags[k])
      : []
  return Response.json({ flags, user: user || c.data.user })
}

export async function onRequestPost(c) {
  if (!c.data.user) throw new APIError('Unauthorized', { status: 401 })
  const body = await c.request.json().catch(() => ({}))
  const flagToAdd = body.flag ? String(body.flag).trim() : null
  const flagsToSet = Array.isArray(body.flags) ? body.flags.map((f) => String(f).trim()).filter(Boolean) : null

  if (!flagToAdd && flagsToSet === null) {
    throw new APIError('Invalid flag payload: expected "flag" (string) or "flags" (array)', { status: 400 })
  }

  const existing = await c.data.d1.get(User, c.data.user.id)
  const currentData = existing?.data || c.data.user.data || {}
  let currentFlags = Array.isArray(currentData.flags)
    ? [...currentData.flags]
    : currentData.flags && typeof currentData.flags === 'object'
      ? Object.keys(currentData.flags).filter((k) => currentData.flags[k])
      : []

  if (flagsToSet !== null) {
    currentFlags = Array.from(new Set(flagsToSet))
  } else if (flagToAdd) {
    if (!currentFlags.includes(flagToAdd)) {
      currentFlags.push(flagToAdd)
    }
  }

  const updates = { data: { flags: currentFlags } }
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
  return Response.json({ flags: currentFlags, user: updated })
}

export async function onRequestDelete(c) {
  if (!c.data.user) throw new APIError('Unauthorized', { status: 401 })
  const body = await c.request.json().catch(() => ({}))
  const url = new URL(c.request.url)
  const flagToDelete = (body.flag ? String(body.flag) : null) || url.searchParams.get('flag')
  if (!flagToDelete) {
    throw new APIError('Missing flag to delete', { status: 400 })
  }

  const trimmed = flagToDelete.trim()
  const existing = await c.data.d1.get(User, c.data.user.id)
  const currentData = existing?.data || c.data.user.data || {}
  const currentFlags = Array.isArray(currentData.flags)
    ? currentData.flags.filter((f) => f !== trimmed)
    : currentData.flags && typeof currentData.flags === 'object'
      ? Object.keys(currentData.flags).filter((k) => k !== trimmed && currentData.flags[k])
      : []

  const updates = { data: { flags: currentFlags } }
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
  return Response.json({ flags: currentFlags, user: updated })
}
