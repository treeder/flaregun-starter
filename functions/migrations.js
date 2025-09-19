import { ClassMigrations } from 'migrations'
import { Product } from './data/products.js'

export async function runMigrations(c) {
  let migrations = new ClassMigrations(c.env.D1, [Product])
  await migrations.run()
}
