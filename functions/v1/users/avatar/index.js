import { APIError } from 'api'
import { nanoid } from 'nanoid'
import { User } from '../../../data/users.js'

export async function onRequestPost(c) {
  if (!c.data.user) {
    throw new APIError('Unauthorized', { status: 401 })
  }

  let formData
  try {
    formData = await c.request.formData()
  } catch (err) {
    throw new APIError('Invalid form data', { status: 400 })
  }

  const file = formData.get('file') || formData.get('avatar') || formData.get('image')
  if (!file || typeof file === 'string') {
    throw new APIError('File is required', { status: 400 })
  }

  if (!file.type || !file.type.startsWith('image/')) {
    throw new APIError('Only image files are allowed', { status: 400 })
  }

  const maxBytes = 10 * 1024 * 1024 // 10MB
  if (file.size && file.size > maxBytes) {
    throw new APIError('File size exceeds 10MB limit', { status: 400 })
  }

  const buffer = await file.arrayBuffer()

  let ext = 'jpg'
  if (file.type === 'image/png') ext = 'png'
  else if (file.type === 'image/webp') ext = 'webp'
  else if (file.type === 'image/gif') ext = 'gif'
  else if (file.type === 'image/svg+xml') ext = 'svg'
  else {
    const parts = (file.name || '').split('.')
    if (parts.length > 1) {
      ext = parts.pop().toLowerCase()
    }
  }

  const filename = `${nanoid()}.${ext}`
  const key = `users/${c.data.user.id}/${filename}`

  await c.env.R2.put(key, buffer, {
    httpMetadata: {
      contentType: file.type || 'image/jpeg',
    },
  })

  const image = `/r2/${key}`
  const existing = await c.data.d1.get(User, c.data.user.id)
  if (!existing) {
    await c.data.d1.insert(User, {
      id: c.data.user.id,
      email: c.data.user.email,
      image,
    })
  } else {
    await c.data.d1.update(User, c.data.user.id, { image })
  }

  const updated = await c.data.d1.get(User, c.data.user.id)
  return Response.json({ success: true, image, user: updated })
}

export async function onRequestDelete(c) {
  if (!c.data.user) {
    throw new APIError('Unauthorized', { status: 401 })
  }

  const existing = await c.data.d1.get(User, c.data.user.id)
  if (existing) {
    await c.data.d1.update(User, c.data.user.id, { image: null })
  }

  const updated = await c.data.d1.get(User, c.data.user.id)
  return Response.json({ success: true, user: updated })
}
