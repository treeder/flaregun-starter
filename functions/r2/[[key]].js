/**
 * This is for serving files from local R2 since there is nothing built-in to handle this.
 *
 * @param {*} c
 * @returns
 */
export async function onRequestGet(c) {
  console.log('GET R2:', c.params.key)
  let key = (c.params.key || []).join('/')
  try {
    key = decodeURIComponent(key) // fixes spaces
  } catch {
    return Response.json({ error: { message: 'Invalid file key' } }, { status: 400 })
  }
  if (!key) {
    return Response.json({ error: { message: 'file not found' } }, { status: 404 })
  }
  const file = await c.env.R2.get(key)
  if (!file) {
    return Response.json({ error: { message: 'file not found' } }, { status: 404 })
  }
  const headers = new Headers()
  headers.append('etag', file.httpEtag)
  headers.set('x-content-type-options', 'nosniff')
  headers.set('content-security-policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox")
  if (file.httpMetadata?.contentType) {
    headers.set('content-type', file.httpMetadata.contentType)
  }
  return new Response(file.body, {
    headers,
  })
}
