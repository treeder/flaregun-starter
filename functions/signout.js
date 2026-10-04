import { getSession, setSession } from 'passkeys/src/sessions.js'
import { deleteCookies } from 'passkeys/src/utils.js'
import { domainLevels } from './utils.js'

async function handleSignOut(c) {
  // Invalidate session in memory and KV if available
  if (c.env?.KV) {
    try {
      const sess = await getSession({ request: c.request, kv: c.env.KV })
      if (sess && sess.id) {
        await setSession({ request: c.request, kv: c.env.KV }, {})
        await c.env.KV.delete(`session-${sess.id}`)
      }
    } catch (e) {
      c.data?.logger?.error?.(e)
    }
  }

  const headers = new Headers({
    Location: '/',
  })

  // 1. Delete domain-scoped cookies using passkeys helper
  try {
    const cookiesWithDomain = deleteCookies(c, { domainLevels: domainLevels(c) })
    for (const cookie of cookiesWithDomain) {
      headers.append('Set-Cookie', cookie)
    }
  } catch (e) {
    c.data?.logger?.error?.(e)
  }

  // 2. Also delete host-only cookies (without domain attribute) for localhost and direct-host setups
  headers.append('Set-Cookie', 'session=; expires=Thu, 01 Jan 1970 00:00:01 UTC; Max-Age=0; Path=/;')
  headers.append('Set-Cookie', 'userId=; expires=Thu, 01 Jan 1970 00:00:01 UTC; Path=/; Max-Age=0;')

  return new Response(null, {
    status: 302,
    headers,
  })
}

export const onRequest = handleSignOut
export const onRequestGet = handleSignOut
export const onRequestPost = handleSignOut
