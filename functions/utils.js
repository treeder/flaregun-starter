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
  if (!h) return ''
  if (h.includes('localhost') || h.includes('127.0.0.1')) {
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

export function domainLevels(c) {
  const host = typeof c === 'string' ? c : hostname(c)
  if (!host) return 2
  return host.endsWith('.workers.dev') || host.endsWith('.pages.dev') ? 3 : 2
}

export function getCookieDomainCandidates(cOrHost) {
  const host = typeof cOrHost === 'string' ? cOrHost : hostname(cOrHost)
  if (!host) return []
  const cleanHost = host.split(':')[0].toLowerCase()
  if (cleanHost === 'localhost' || cleanHost === '127.0.0.1' || cleanHost === '::1') {
    return []
  }
  const parts = cleanHost.split('.')
  const isWorkersOrPages = cleanHost.endsWith('.workers.dev') || cleanHost.endsWith('.pages.dev')
  const isTwoPartTld = /\.(co|com|org|net|edu|gov)\.[a-z]{2}$/.test(cleanHost)
  const minLevels = isWorkersOrPages || isTwoPartTld ? 3 : 2

  const domains = []
  for (let i = parts.length; i >= minLevels; i--) {
    const domain = parts.slice(parts.length - i).join('.')
    domains.push(domain)
    domains.push(`.${domain}`)
  }
  return [...new Set(domains)]
}

export function clearAuthCookies(c, headers = new Headers()) {
  const host = hostname(c) || ''
  const domainCandidates = getCookieDomainCandidates(host)

  // Standard app cookies to clear
  const defaultCookieNames = ['session', 'userId']

  // Also include any cookie names present in the incoming Cookie header
  const cookieHeader = c.request?.headers?.get?.('cookie') || ''
  const requestCookieNames = cookieHeader
    .split(';')
    .map((item) => item.split('=')[0].trim())
    .filter(Boolean)

  const cookieNames = Array.from(new Set([...defaultCookieNames, ...requestCookieNames]))
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host === '::1'

  for (const name of cookieNames) {
    // 1. Host-only (no domain specified)
    headers.append('Set-Cookie', `${name}=; Path=/; expires=Thu, 01 Jan 1970 00:00:01 UTC; Max-Age=0; SameSite=Lax`)
    if (!isLocal) {
      headers.append(
        'Set-Cookie',
        `${name}=; Path=/; expires=Thu, 01 Jan 1970 00:00:01 UTC; Max-Age=0; SameSite=Lax; Secure`,
      )
    }

    // 2. Clear for all candidate domains (e.g. preview URL, parent domain .treeder.workers.dev, etc.)
    for (const domain of domainCandidates) {
      headers.append(
        'Set-Cookie',
        `${name}=; Path=/; Domain=${domain}; expires=Thu, 01 Jan 1970 00:00:01 UTC; Max-Age=0; SameSite=Lax`,
      )
      if (!isLocal) {
        headers.append(
          'Set-Cookie',
          `${name}=; Path=/; Domain=${domain}; expires=Thu, 01 Jan 1970 00:00:01 UTC; Max-Age=0; SameSite=Lax; Secure`,
        )
      }
    }
  }

  return headers
}
