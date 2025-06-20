import { runMigrations } from "./migrations.js"

let count = 0
export async function once(c) {
  if (count > 0) return
  count++
  await runMigrations(c)
}