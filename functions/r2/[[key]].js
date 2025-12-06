import { APIError } from 'api'

/**
 * This is for serving files from local R2 since there is nothing built-in to handle this.
 *
 * @param {*} c
 * @returns
 */
export async function onRequestGet(c) {
  console.log('GET R2:', c.params.key)
  let key = c.params.key.join('/')
  // key = key.replace(/%2F/g, '/')
  key = decodeURIComponent(key) // fixes spaces
  // console.log("Local r2 key: ", key)
  const file = await c.env.R2.get(key)
  if (!file) throw new APIError('file not found', { status: 404 })
  const headers = new Headers()
  headers.append('etag', file.httpEtag)
  return new Response(file.body, {
    headers,
  })
}
