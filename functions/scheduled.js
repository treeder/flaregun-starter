import { once } from 'once'
import { init, initRequest } from './init.js'

/**
 * Be aware that no middleware or anything will run here.
 *
 * @param {*} c
 */
export async function scheduled(c) {
  let st = new Date(c.controller.scheduledTime)
  console.log('scheduled:', c.controller.cron, st)
  await initRequest(c)
  await once(init, c)

  await c.data.globals.scheduler.run(c, c.controller)
}
