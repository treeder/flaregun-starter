import { Migrations } from 'migrations'
import { ApiKey } from './apiKeys.js'
import { Order } from './orders.js'
import { Product } from './products.js'
import { Review } from './reviews.js'
import { User } from './users.js'

export async function runMigrations(c) {
  let migrations = new Migrations(c.env.D1, [User, Product, Review, Order, ApiKey])
  await migrations.run()
}
