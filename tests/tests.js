import 'dotenv/config'
import { API } from 'api'
import { TestKit } from 'testkit'
import { test1 } from './test1.js'

// Create the context for your tests, include anything the need to run
let apiURL = 'http://localhost:8787'
let api = new API({
  apiURL,
})

let c = {
  api,
  env: process.env,
}

let testKit = new TestKit(c, [test1])
await testKit.run()
