export async function onRequestGet(c) {
  const headers = new Headers({
    Location: '/',
  })
  headers.append('Set-Cookie', 'session=; expires=Thu, 01 Jan 1970 00:00:01 UTC; Path=/;')
  headers.append('Set-Cookie', 'userId=; expires=Thu, 01 Jan 1970 00:00:01 UTC; Path=/;')
  return new Response(null, {
    status: 302,
    headers,
  })
}
