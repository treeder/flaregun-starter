function canTrustForwardedHost(c, hostHeader) {
  if (c?.data?.env === 'dev' || c?.env?.ENV === 'dev') return true
  if (!hostHeader) return true
  const rawHost = hostHeader.split(':')[0].toLowerCase()
  return (
    rawHost === 'localhost' ||
    rawHost === '127.0.0.1' ||
    rawHost === '[::1]' ||
    rawHost.endsWith('.local')
  )
}

function getEffectiveHostHeader(c) {
  let req = c?.request || c
  const hostHeader = req?.headers?.get?.('host')
  const forwardedHost = req?.headers?.get?.('x-forwarded-host')
  if (forwardedHost && canTrustForwardedHost(c, hostHeader)) {
    return forwardedHost.split(',')[0].trim()
  }
  return hostHeader || ''
}

export function hostname(c) {
  if (!c) return ''
  if (typeof c === 'string') return c.split(':')[0]
  let h = getEffectiveHostHeader(c)
  if (h) {
    h = h.split(':')[0] // remove port
  }
  return h || ''
}

export function hostURL(c) {
  let h = hostname(c)
  if (!h) return ''
  const lower = h.toLowerCase()
  if (lower === 'localhost' || lower === '127.0.0.1' || lower === '[::1]') {
    let h2 = getEffectiveHostHeader(c)
    let port = ''
    if (h2) {
      let split = h2.split(':')
      if (split.length > 1 && /^\d+$/.test(split[split.length - 1])) {
        port = `:${split[split.length - 1]}`
      }
    }
    return `http://${h}${port}`
  }
  h = 'https://' + h
  return h
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function domainLevels(c) {
  if (!c) return 2
  const host = typeof c === 'string' ? c : hostname(c)
  if (!host) return 2
  return host.endsWith('.workers.dev') || host.endsWith('.pages.dev') ? 3 : 2
}

export function getCookieDomainCandidates(cOrHost) {
  if (!cOrHost) return []
  const host = typeof cOrHost === 'string' ? cOrHost : hostname(cOrHost)
  if (!host) return []
  const cleanHost = host.split(':')[0].toLowerCase()
  if (
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost.includes('::1') ||
    /^[\d.]+$/.test(cleanHost)
  ) {
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

export const AUTH_COOKIE_NAMES = ['session']

export function clearAuthCookies(c, headers = new Headers()) {
  if (!c) return headers
  const host = (typeof c === 'string' ? c : hostname(c)) || ''
  const domainCandidates = getCookieDomainCandidates(host)
  const lowerHost = host.toLowerCase()
  const isLocal =
    c?.data?.env === 'dev' ||
    c?.env?.ENV === 'dev' ||
    lowerHost === 'localhost' ||
    lowerHost === '127.0.0.1' ||
    lowerHost.includes('::1')

  for (const name of AUTH_COOKIE_NAMES) {
    // 1. Host-only (no domain specified)
    headers.append('Set-Cookie', `${name}=; Path=/; expires=Thu, 01 Jan 1970 00:00:01 UTC; Max-Age=0; SameSite=Lax`)
    if (!isLocal) {
      headers.append(
        'Set-Cookie',
        `${name}=; Path=/; expires=Thu, 01 Jan 1970 00:00:01 UTC; Max-Age=0; SameSite=Lax; Secure`,
      )
    }

    // 2. Clear for all candidate domains (e.g. preview URL, parent domain .orgname.workers.dev, etc.)
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
