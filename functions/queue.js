// https://developers.cloudflare.com/queues/configuration/javascript-apis/#consumer
import { Product } from './data/products.js'
import { D1 } from 'flaregun'

export async function queue(c) {
  console.log('env:', c.env)
  console.log('d1?', c.env.D1)
  let d1 = new D1(c.env.D1)
  let r = await d1.first(Product)
  console.log('first product in queue:', r)
  for (const message of c.batch.messages) {
    console.log('Received', message)
  }
}
