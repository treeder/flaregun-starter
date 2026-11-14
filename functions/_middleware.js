import { Rend } from 'rend'
import { layout } from './layout.js'
import { init, initRequest } from './init.js'
import { once } from 'once'
import { cors } from 'flaregun/middleware/cors.js'
import { timer } from 'flaregun/middleware/timer.js'

import { getSession } from 'passkeys/src/sessions.js'
import { extractApiKeyToken, hasApiKeyScope, resolveApiKey } from './data/apiKeys.js'
import { User } from './data/users.js'

export async function wrap(c) {
  await initRequest(c)
  try {
    await once(init, c)

    // Check auth (API key first, otherwise session cookie) and set c.data.user if authenticated
    const token = extractApiKeyToken(c.request)
    if (token) {
      const apiKey = await resolveApiKey(c, token)
      if (apiKey) {
        const user = await c.data.d1.get(User, apiKey.userId)
        if (user) {
          c.data.user = user
          c.data.apiKey = apiKey
          c.data.isAgent = true
        }
      }
    } else {
      const sess = await getSession({ request: c.request, kv: c.env.KV })
      if (sess && sess.userId) {
        let user = await c.data.d1.get(User, sess.userId)
        let kvUser = null
        if (!user || !user.email) {
          try {
            const rawKvUser = await c.env.KV.get(`users-${sess.userId}`)
            if (rawKvUser) {
              kvUser = JSON.parse(rawKvUser)
            }
          } catch (e) {}
        }

        const email = user?.email || sess?.email || kvUser?.email || (sess.userId.includes('@') ? sess.userId : null)

        if (!user) {
          user = { id: sess.userId, email }
          try {
            await c.data.d1.insert(User, user)
          } catch (e) {}
        } else if (!user.email && email) {
          user.email = email
          try {
            await c.data.d1.update(User, user.id, { email })
          } catch (e) {}
        }
        c.data.user = user
      }
    }

    const reqPathname = new URL(c.request.url).pathname
    if (c.data.apiKey && reqPathname.startsWith('/v1/') && !reqPathname.startsWith('/v1/apiKeys')) {
      const isReadMethod = c.request.method === 'GET' || c.request.method === 'HEAD' || c.request.method === 'OPTIONS'
      const requiredScope = isReadMethod ? 'read' : 'write'
      if (!hasApiKeyScope(c, requiredScope)) {
        return Response.json(
          { error: { message: `Forbidden: API key lacks required "${requiredScope}" scope` } },
          { status: 403 },
        )
      }
    }

    c.data.rend = new Rend({
      layout,
      data: {
        get user() {
          return c.data.user
        },
        get path() {
          return c.url ? c.url.pathname : c.request ? new URL(c.request.url).pathname : ''
        },
      },
    })

    return await c.next()
  } catch (err) {
    return await c.data.errorHandler.handle(c, err)
  }
}

export const onRequest = [timer, cors, wrap]
