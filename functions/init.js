import { KV, Scheduler } from 'flaregun'
import { runMigrations } from './data/migrations.js'
import { globals } from './globals.js'
import { ConsoleMailer } from './services/mailer.js'
import { nanoid } from 'nanoid'
import { ConsoleLogger } from 'console-logger'
import { D1, ErrorHandler, CloudflareLogger } from 'flaregun'

/**
 * Call this once at startup.
 * @param {*} c
 */
export async function init(c) {
  await runMigrations(c)

  globals.x = 'set one time things on the globals object here'

  let scheduler = new Scheduler()
  scheduler.addEventListener('minute', everyMinuteFunction)
  scheduler.addEventListener('5minutes', every5MinutesFunction)
  scheduler.addEventListener('hour', everyHourFunction)
  globals.scheduler = scheduler

  globals.mailer = new ConsoleMailer()
}

function everyMinuteFunction(evt) {
  console.log('MINUTE', evt, evt.detail)
}

function every5MinutesFunction(evt) {
  console.log('5 MINUTES', evt, evt.detail)
}

function everyHourFunction(evt) {
  console.log('HOUR', evt, evt.detail)
}

/**
 * Call this every request.
 *
 * @param {*} c
 */
export async function initRequest(c) {
  c.data.globals = globals // make globals accessible through context
  let rid = nanoid()
  let ldata = {
    requestId: rid,
  }
  if (c.request) {
    let req = c.request
    let url = new URL(req.url)
    ldata.method = req.method
    ldata.path = url.pathname
  }
  let logger = new ConsoleLogger({ data: ldata })
  if (c.env.ENV == 'prod') {
    logger = new CloudflareLogger({ data: ldata })
  }
  c.data.logger = logger
  const errorHandler = new ErrorHandler({
    logger,
  })
  c.data.errorHandler = errorHandler

  c.data.env = c.env.ENV
  c.data.d1 = new D1(c.env.D1)
  c.data.kv = new KV(c.env.KV)
  c.data.r2 = c.env.R2
}
