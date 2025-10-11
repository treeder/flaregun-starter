export function hostname(c) {
  let req = c.request
  let h = req.headers.get('x-forwarded-host') || req.headers.get('host')
  if (h) {
    h = h.split(':')[0] // remove port
  }
  return h
}

export function hostURL(c) {
  let h = hostname(c)
  if (h.includes('localhost')) {
    let req = c.request
    let h2 = req.headers.get('x-forwarded-host') || req.headers.get('host')
    let port = ''
    if (h2) {
      let split = h2.split(':')
      if (split.length > 1) {
        port = `:${split[1]}`
      }
    }
    return `http://${h}${port}`
  }
  h = 'https://' + h
  return h
}
