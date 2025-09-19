import { Scheduler } from 'flaregun'
import { runMigrations } from './data/migrations.js'
import { globals } from './globals.js'

export async function init(c) {
  await runMigrations(c)

  globals.scheduler = new Scheduler()
  globals.scheduler.addEventListener('minute', scheduledFunction)
}

function scheduledFunction(evt) {
  console.log('scheduledFunction minute', evt, evt.details)
}
