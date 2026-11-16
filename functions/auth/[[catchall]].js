import { Passkeys } from 'passkeys'
import { hostURL, domainLevels } from '../utils.js'
import { isoBase64URL } from '@simplewebauthn/server/helpers'
import { User } from '../data/users.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sanitizeRedirectLocation(rawLocation, origin) {
  if (!rawLocation) return '/'
  const loc = String(rawLocation).trim()
  if (/[\x00-\x1f\x7f]/.test(loc)) return '/'
  if (loc.startsWith('/') && !loc.startsWith('//') && !loc.startsWith('/\\')) {
    return loc
  }
  try {
    const parsed = new URL(loc)
    const expectedOrigin = new URL(origin).origin
    if (parsed.origin === expectedOrigin) {
      return parsed.href
    }
  } catch {}
  return '/'
}

function assertInteractiveSession(c) {
  if (!c.data.user) {
    return Response.json({ error: { message: 'Authentication required' } }, { status: 401 })
  }
  if (c.data.isAgent) {
    return Response.json({ error: { message: 'Forbidden: session authentication required' } }, { status: 403 })
  }
  return null
}

export async function onRequest(c) {
  let p = c.params.catchall
  const origin = hostURL(c)
  let passkeys = new Passkeys({
    appName: 'Flaregun',
    baseURL: `${origin}/auth`,
    domainLevels: domainLevels(c),
    kv: c.env.KV,
    mailer: c.data.mailer,
    logger: c.data.logger,
    emailStart: async ({ email }) => {
      let normalized = (email || '').toLowerCase().trim()
      let user = await c.data.d1.first(User, { where: { email: normalized } })
      if (!user) {
        user = await c.data.d1.insert(User, {
          email: normalized,
          name: normalized.split('@')[0],
        })
      }
      return { userId: user.id }
    },
  })

  if (p[0] == 'email') {
    if (p[1] == 'start') {
      if (c.request.method !== 'POST') {
        return Response.json({ error: { message: 'Method not allowed' } }, { status: 405 })
      }

      let body = null
      try {
        body = await c.request.clone().json()
      } catch {
        return Response.json({ error: { message: 'Invalid JSON body' } }, { status: 400 })
      }

      const email = String(body?.email || '')
        .trim()
        .toLowerCase()
      if (!email || !EMAIL_RE.test(email)) {
        return Response.json({ error: { message: 'A valid email address is required' } }, { status: 400 })
      }

      const res = await passkeys.emailStart(c)
      if (c.data.env === 'dev' && res.ok && c.data.mailer.lastUrl) {
        const data = await res.json()
        return Response.json({
          ...data,
          link: c.data.mailer.lastUrl,
        })
      }
      return res
    }
    if (p[1] == 'verify') {
      const token = new URL(c.request.url).searchParams.get('token')
      if (!token) {
        return Response.json({ error: { message: 'Verification token is required' } }, { status: 400 })
      }

      const res = await passkeys.emailVerify(c)
      if (res.status === 302) {
        await c.env.KV.delete(`email-token-${token}`)
        const safeLocation = sanitizeRedirectLocation(res.headers.get('Location'), origin)
        const headers = new Headers(res.headers)
        headers.set('Location', safeLocation)
        return new Response('Email Verified', {
          status: 302,
          headers,
        })
      }
      return res
    }
  } else if (p[0] == 'passkeys') {
    if (p[1] == 'new') {
      const authErr = assertInteractiveSession(c)
      if (authErr) return authErr
      return await passkeys.new(c)
    }
    if (p[1] == 'start') {
      return await passkeys.start(c)
    }
    if (p[1] == 'create') {
      const authErr = assertInteractiveSession(c)
      if (authErr) return authErr
      let body = null
      try {
        body = await c.request.clone().json()
      } catch {
        return Response.json({ error: { message: 'Invalid JSON body' } }, { status: 400 })
      }
      if (body?.userId) {
        let decodedUserId = body.userId
        try {
          decodedUserId = isoBase64URL.toUTF8String(body.userId)
        } catch {}
        if (decodedUserId !== c.data.user.id && body.userId !== c.data.user.id) {
          return Response.json({ error: { message: 'Forbidden: user mismatch' } }, { status: 403 })
        }
      }
      return await passkeys.create(c)
    }
    if (p[1] == 'verify') {
      return await passkeys.verify(c)
    }
    if (p[1] == 'check') {
      const authErr = assertInteractiveSession(c)
      if (authErr) return authErr
      return await passkeys.check(c)
    }
    if (p[1] == 'list' && c.request.method === 'GET') {
      const authErr = assertInteractiveSession(c)
      if (authErr) return authErr
      return await passkeys.list(c)
    }
    if ((p[1] == 'delete' || p[1] == 'remove') && (c.request.method === 'POST' || c.request.method === 'DELETE')) {
      const authErr = assertInteractiveSession(c)
      if (authErr) return authErr
      return await passkeys.delete(c)
    }
  }

  return Response.json({ error: { message: 'Not found' } }, { status: 404 })
}
