// https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/
import { getProducts, Product } from './data/products.js'
import { D1, Scheduler } from 'flaregun'
import { globals } from './globals.js'

export async function scheduled(c) {
  console.log(c.controller.cron, c.controller.type, new Date(c.controller.scheduledTime))
  // ctx.waitUntil(doSomeTaskOnASchedule());
  let d1 = new D1(c.env.D1)
  c.data.d1 = d1
  let r = await d1.first(Product)
  console.log('first product in scheduled:', r)

  // try functions:
  let products = await getProducts(c, {})
  console.log('products:', products)

  await globals.scheduler.run(c, c.controller)
}
