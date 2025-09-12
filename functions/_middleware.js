import { nanoid } from 'nanoid'
import { ConsoleLogger } from 'console-logger'
import { D1, ErrorHandler } from 'flaregun'
import { Rend } from 'rend'
import { layout } from './layout.js'
import { init } from './_once.js'
import { once } from 'once'
import { cors } from 'flaregun/middleware/cors.js'
import { timer } from 'flaregun/middleware/timer.js'

const errorHandler = new ErrorHandler()
export async function wrap(c) {
  try {
    let req = c.request

    // setup logger
    let rid = nanoid()
    let url = new URL(req.url)
    let logger = new ConsoleLogger({ data: { requestID: rid, path: url.pathname } })
    if (c.env.BETTERSTACK) {
      //   logger = new BetterstackLogger({ ...JSON.parse(c.env.BETTERSTACK), data: { requestID: rid, path: url.pathname } })
    }
    c.data.logger = logger

    if (url.pathname.includes('.')) {
      // skip static assets
      return await c.next()
    }
    await once(init, c)

    // setup env vars
    c.data.env = c.env.ENV
    // c.data.someAPI = JSON.parse(c.env.SOME_API)

    c.data.d1 = new D1(c.env.D1)
    c.data.kv = c.env.KV
    c.data.r2 = c.env.R2

    c.data.rend = new Rend({
      layout,
    })

    let r = await c.next()
    return r
  } catch (err) {
    return await errorHandler.handle(c, err)
  }
}

export const onRequest = [timer, cors, wrap]
