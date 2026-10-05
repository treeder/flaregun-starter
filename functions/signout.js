import { getSession, setSession } from 'passkeys/src/sessions.js'
import { clearAuthCookies } from './utils.js'

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

  clearAuthCookies(c, headers)

  return new Response(null, {
    status: 302,
    headers,
  })
}

export const onRequest = handleSignOut
export const onRequestGet = handleSignOut
export const onRequestPost = handleSignOut
