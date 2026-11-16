import { APIError } from 'api'
import { nanoid } from 'nanoid'

const ALLOWED_IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif'],
  ['image/gif', 'gif'],
])

export async function onRequestPost(c) {
  if (!c.data.user) {
    throw new APIError('Unauthorized', { status: 401 })
  }

  let formData
  try {
    formData = await c.request.formData()
  } catch {
    throw new APIError('Invalid form data', { status: 400 })
  }

  const file = formData.get('file') || formData.get('image')
  if (!file || typeof file === 'string') {
    throw new APIError('Image file is required', { status: 400 })
  }

  const ext = ALLOWED_IMAGE_TYPES.get((file.type || '').toLowerCase())
  if (!ext) {
    throw new APIError('Only JPG, PNG, WEBP, AVIF, and GIF image files are allowed', { status: 400 })
  }

  const maxBytes = 10 * 1024 * 1024 // 10MB
  if (file.size && file.size > maxBytes) {
    throw new APIError('File size exceeds 10MB limit', { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  if (buffer.byteLength === 0) {
    throw new APIError('Uploaded file is empty', { status: 400 })
  }
  if (buffer.byteLength > maxBytes) {
    throw new APIError('File size exceeds 10MB limit', { status: 400 })
  }

  const filename = `product-${nanoid()}.${ext}`
  const key = `products/${c.data.user.id}/${filename}`

  await c.data.r2.put(key, buffer, {
    httpMetadata: {
      contentType: file.type.toLowerCase(),
    },
  })

  const image = `/r2/${key}`
  return Response.json({ success: true, image, key })
}
