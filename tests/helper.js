import { API } from 'api'
import 'dotenv/config'

export const port = process.env.PORT || 8787
export const baseUrl = `http://localhost:${port}`

export const api = new API({
  apiURL: baseUrl,
})

export const c = {
  api,
  env: process.env,
}
