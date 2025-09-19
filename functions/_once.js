import { ErrorHandler } from 'flaregun'
import { runMigrations } from './data/migrations.js'

export async function init(c) {
  await runMigrations(c)
}
