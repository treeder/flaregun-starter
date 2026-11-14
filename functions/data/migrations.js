import { Migrations } from 'migrations'
import { ApiKey } from './apiKeys.js'
import { Product } from './products.js'
import { User } from './users.js'

export async function runMigrations(c) {
  let migrations = new Migrations(c.env.D1, [User, Product, ApiKey])
  await migrations.run()
}
