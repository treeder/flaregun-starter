import { ErrorHandler } from 'flaregun'
import { runMigrations } from './migrations.js'

export async function init(c) {
  await runMigrations(c)
}
