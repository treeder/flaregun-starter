import { Scheduler } from 'flaregun'
import { runMigrations } from './data/migrations.js'
import { globals } from './globals.js'
import { ConsoleMailer } from './services/mailer.js'

export async function init(c) {
  await runMigrations(c)

  globals.x = 'set one time configured things on the globals object here'

  globals.scheduler = new Scheduler()
  globals.scheduler.addEventListener('minute', scheduledFunction)

  globals.mailer = new ConsoleMailer()
}

function scheduledFunction(evt) {
  console.log('scheduledFunction minute', evt, evt.details)
}
