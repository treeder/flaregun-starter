import { API } from 'api'
import 'dotenv/config'

export const api = new API({
  apiURL: 'http://localhost:8787',
})

export const c = {
  api,
  env: process.env,
}
