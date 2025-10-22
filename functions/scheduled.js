// https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/
import { getProducts, Product } from './data/products.js'
import { D1, Scheduler } from 'flaregun'
import { globals } from './globals.js'
import { once } from 'once'
import { init } from './_once.js'

/**
 * Be aware that no middleware or anything will run here.
 *
 * @param {*} c
 */
export async function scheduled(c) {
  let st = new Date(c.controller.scheduledTime)
  console.log('scheduled:', c.controller.cron, c.controller.type, c.controller.scheduledTime, st)
}
