// https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/
import { Product } from './data/products.js'
import { D1 } from 'flaregun'

export async function scheduled(c) {
  console.log(c.controller.cron, c.controller.type, new Date(c.controller.scheduledTime))
  // ctx.waitUntil(doSomeTaskOnASchedule());
  let d1 = new D1(c.env.D1)
  let r = await d1.first(Product)
  console.log('first user in scheduled:', r)
}
