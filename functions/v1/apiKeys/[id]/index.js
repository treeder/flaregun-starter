import { ApiKey } from '../../../data/apiKeys.js'

export async function onRequestDelete(c) {
  if (!c.data.user) {
    return Response.json({ error: { message: 'Authentication required' } }, { status: 401 })
  }
  if (c.data.isAgent) {
    return Response.json(
      { error: { message: 'Forbidden: session authentication required to revoke API keys' } },
      { status: 403 },
    )
  }

  const existing = await c.data.d1.get(ApiKey, c.params.id)
  if (!existing) {
    return Response.json({ error: { message: 'API key not found' } }, { status: 404 })
  }
  if (existing.userId !== c.data.user.id) {
    return Response.json({ error: { message: 'Forbidden: you can only revoke your own API keys' } }, { status: 403 })
  }

  if (existing.keyHash) {
    await c.data.kv.delete(`apiKey:${existing.keyHash}`)
  }
  await c.data.d1.delete(ApiKey, existing.id)

  return Response.json({ success: true, message: 'API key revoked' })
}
