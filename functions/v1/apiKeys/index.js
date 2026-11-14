import {
  ApiKey,
  DEFAULT_API_KEY_SCOPES,
  formatApiKey,
  generateApiKeyToken,
  hashApiKey,
  maskApiKey,
} from '../../data/apiKeys.js'

const ALLOWED_SCOPES = new Set(['mcp', 'read', 'write', '*'])

export async function onRequestGet(c) {
  if (!c.data.user) {
    return Response.json({ error: { message: 'Authentication required' } }, { status: 401 })
  }
  if (c.data.isAgent) {
    return Response.json(
      { error: { message: 'Forbidden: session authentication required to manage API keys' } },
      { status: 403 },
    )
  }

  const keys = await c.data.d1.query(ApiKey, {
    where: { userId: c.data.user.id },
    order: [['createdAt', 'desc']],
  })

  return Response.json({
    apiKeys: keys.map(formatApiKey),
  })
}

export async function onRequestPost(c) {
  if (!c.data.user) {
    return Response.json({ error: { message: 'Authentication required' } }, { status: 401 })
  }
  if (c.data.isAgent) {
    return Response.json(
      { error: { message: 'Forbidden: session authentication required to create API keys' } },
      { status: 403 },
    )
  }

  let body = {}
  try {
    const raw = await c.request.text()
    if (raw.trim()) {
      body = JSON.parse(raw)
    }
  } catch {
    return Response.json({ error: { message: 'Invalid JSON payload' } }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json({ error: { message: 'Valid JSON object payload is required' } }, { status: 400 })
  }

  const input = body.apiKey && typeof body.apiKey === 'object' && !Array.isArray(body.apiKey) ? body.apiKey : body
  const name = String(input.name ?? 'MCP Agent Key').trim() || 'MCP Agent Key'
  if (name.length > 100) {
    return Response.json({ error: { message: 'API key name must be 100 characters or fewer' } }, { status: 400 })
  }

  let scopes = DEFAULT_API_KEY_SCOPES
  if (input.scopes !== undefined) {
    if (!Array.isArray(input.scopes) || input.scopes.length === 0) {
      return Response.json({ error: { message: 'scopes must be a non-empty array of strings' } }, { status: 400 })
    }
    const normalized = [...new Set(input.scopes.map((s) => String(s).trim()).filter(Boolean))]
    if (normalized.length === 0 || normalized.some((s) => !ALLOWED_SCOPES.has(s))) {
      return Response.json({ error: { message: 'Invalid scope. Allowed scopes: mcp, read, write' } }, { status: 400 })
    }
    scopes = normalized
  }

  let expiresAt = null
  if (input.expiresAt !== undefined && input.expiresAt !== null && input.expiresAt !== '') {
    const parsed = new Date(input.expiresAt)
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
      return Response.json({ error: { message: 'expiresAt must be a valid future date' } }, { status: 400 })
    }
    expiresAt = parsed
  }

  const rawKey = generateApiKeyToken()
  const keyHash = await hashApiKey(rawKey)
  const maskedKey = maskApiKey(rawKey)

  const record = {
    name,
    keyHash,
    maskedKey,
    userId: c.data.user.id,
    scopes,
    expiresAt,
    data: {},
  }

  await c.data.d1.insert(ApiKey, record)
  const created = await c.data.d1.get(ApiKey, record.id)
  await c.data.kv.putJSON(`apiKey:${keyHash}`, created, { expirationTtl: 86400 })

  return Response.json(
    {
      apiKey: {
        ...formatApiKey(created),
        key: rawKey,
      },
      message: 'Store this API key safely. For security, the full key is only shown once.',
    },
    { status: 201 },
  )
}
