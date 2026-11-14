import { nanoid } from 'nanoid'

export const DEFAULT_API_KEY_SCOPES = ['mcp', 'read', 'write']

export class ApiKey {
  static table = 'apiKeys'
  static properties = {
    id: {
      type: String,
      primaryKey: true,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
    name: {
      type: String,
    },
    keyHash: {
      type: String,
    },
    maskedKey: {
      type: String,
    },
    userId: {
      type: String,
    },
    scopes: {
      type: Object,
    },
    lastUsedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    data: {
      type: Object,
    },
  }
}

export function generateApiKeyToken() {
  return `fg_key_${nanoid(32)}`
}

export function maskApiKey(rawKey) {
  if (!rawKey || rawKey.length < 16) return '••••••••'
  return `${rawKey.slice(0, 11)}...${rawKey.slice(-4)}`
}

export async function hashApiKey(rawKey) {
  const bytes = new TextEncoder().encode(String(rawKey))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function extractApiKeyToken(request) {
  const authHeader = request.headers.get('Authorization') || ''
  if (authHeader) {
    const lower = authHeader.toLowerCase()
    if (lower.startsWith('bearer ')) {
      const token = authHeader.slice(7).trim()
      if (token) return token
    } else if (lower.startsWith('apikey ')) {
      const token = authHeader.slice(7).trim()
      if (token) return token
    }
  }

  const headerKey = request.headers.get('x-api-key')?.trim()
  if (headerKey) return headerKey

  const url = new URL(request.url)
  if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp/')) {
    const queryToken = url.searchParams.get('token')?.trim() || url.searchParams.get('apiKey')?.trim()
    if (queryToken) return queryToken
  }

  return null
}

export async function resolveApiKey(c, rawToken) {
  if (!rawToken) return null
  const keyHash = await hashApiKey(rawToken)
  const cacheKey = `apiKey:${keyHash}`

  let record = await c.data.kv.getJSON(cacheKey)
  if (!record) {
    record = await c.data.d1.first(ApiKey, { where: { keyHash } })
    if (record) {
      await c.data.kv.putJSON(cacheKey, record, { expirationTtl: 86400 })
    }
  }

  if (!record) return null

  if (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now()) {
    return null
  }

  const lastUsed = record.lastUsedAt ? new Date(record.lastUsedAt).getTime() : 0
  if (Date.now() - lastUsed > 60_000) {
    const now = new Date()
    c.waitUntil(
      (async () => {
        try {
          await c.data.d1.update(ApiKey, record.id, { lastUsedAt: now })
          await c.data.kv.putJSON(cacheKey, { ...record, lastUsedAt: now.toISOString() }, { expirationTtl: 86400 })
        } catch (err) {
          c.data.logger.log('Failed to touch apiKey lastUsedAt', err)
        }
      })(),
    )
  }

  return record
}

export function hasApiKeyScope(c, scope) {
  if (!c.data.apiKey) return true
  const scopes = Array.isArray(c.data.apiKey.scopes) ? c.data.apiKey.scopes : DEFAULT_API_KEY_SCOPES
  if (scopes.includes('*') || scopes.includes(scope)) return true
  if (scope === 'write') {
    return !scopes.includes('read') && scopes.includes('mcp')
  }
  if (scope === 'read') {
    return scopes.includes('write') || scopes.includes('mcp')
  }
  return false
}

export function formatApiKey(record) {
  return {
    id: record.id,
    name: record.name || 'API Key',
    maskedKey: record.maskedKey || '••••••••',
    userId: record.userId,
    scopes: Array.isArray(record.scopes) ? record.scopes : DEFAULT_API_KEY_SCOPES,
    lastUsedAt: record.lastUsedAt || null,
    expiresAt: record.expiresAt || null,
    createdAt: record.createdAt || null,
  }
}
