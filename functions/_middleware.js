import { Rend } from 'rend'
import { layout } from './layout.js'
import { init, initRequest } from './init.js'
import { once } from 'once'
import { cors } from 'flaregun/middleware/cors.js'
import { timer } from 'flaregun/middleware/timer.js'

import { getSession } from 'passkeys/src/sessions.js'
import { User } from './data/users.js'

export async function wrap(c) {
  await initRequest(c)
  try {
    await once(init, c)

    // Check auth and set c.data.user if logged in
    const sess = await getSession({ request: c.request, kv: c.env.KV })
    if (sess && sess.userId) {
      let user = await c.data.d1.get(User, sess.userId)
      if (!user) {
        user = { id: sess.userId, email: sess.email }
      }
      c.data.user = user
    }

    c.data.rend = new Rend({
      layout,
      data: {
        get user() {
          return c.data.user
        },
      },
    })

    return await c.next()
  } catch (err) {
    return await c.data.errorHandler.handle(c, err)
  }
}

export const onRequest = [timer, cors, wrap]
