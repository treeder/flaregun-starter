import { runMigrations } from "./migrations.js"

let finished
export async function once(c) {
  if (finished) return finished
  finished = init(c)
  return finished
}

async function init(c) {
  await runMigrations(c)
}
