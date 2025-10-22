import { Rend } from 'rend'
import { layout } from './layout.js'
import { init, initRequest } from './init.js'
import { once } from 'once'
import { cors } from 'flaregun/middleware/cors.js'
import { timer } from 'flaregun/middleware/timer.js'

export async function wrap(c) {
  await initRequest(c)
  try {
    await once(init, c)

    c.data.rend = new Rend({
      layout,
    })

    return await c.next()
  } catch (err) {
    return await c.data.errorHandler.handle(c, err)
  }
}

export const onRequest = [timer, cors, wrap]
