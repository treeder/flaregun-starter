// https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/
import { getProducts, Product } from './data/products.js'
import { D1, Scheduler } from 'flaregun'
import { globals } from './globals.js'
import once from 'once'
import { init } from './_once.js'

/**
 * Be aware that no middleware or anything will run here.
 *
 * @param {*} c
 */
export async function scheduled(c) {
  let st = new Date(c.controller.scheduledTime)
  console.log(c.controller.cron, c.controller.type, c.controller.scheduledTime, st)

  await once(c, init)

  let d1 = new D1(c.env.D1)
  c.data.d1 = d1
  let r = await d1.first(Product)
  console.log('first product in scheduled:', r)

  // try functions:
  let products = await getProducts(c, {})
  console.log('products:', products)
  await globals.scheduler.run(c, c.controller)
  // c.waitUntil(doSomeTaskOnASchedule());
}
