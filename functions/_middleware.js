import { nanoid } from "nanoid"
import { ConsoleLogger } from "console-logger"
import { D1 } from "flaregun"
import { Rend } from "rend"
import { layout } from "./layout.js"
import { once } from "./_once.js"

export async function onRequest(c) {
  console.log("MIDDLEWARE")
  c.data.startTime = Date.now()
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
    c.data.logger.log("start of request")

    if (url.pathname.includes('.')) {
      // skip static assets
      return await c.next()
    }

    await once(c)

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
    console.log("ERROR!!!!", err)
    c.data.logger.log(err)
    return Response.json({ error: err.message }, { status: err.status || 500 })
  } finally {
    c.waitUntil(finish(c))
  }
}

export async function finish(c) {
  const duration = Date.now() - c.data.startTime
  console.log("finish")
  c.data.logger.log("end of request", { duration }) // to use Baselime's duration feature
  await c.data.logger.flush()
  // console.log("posted to baselime")
}