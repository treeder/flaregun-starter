export function getCookieDomainCandidates(hostname) {
  if (!hostname) return []
  const cleanHost = hostname.split(':')[0].toLowerCase()
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

export function clearClientCookies() {
  if (typeof document === 'undefined') return

  const defaultCookieNames = ['session', 'userId']
  const documentCookieNames = document.cookie
    ? document.cookie
        .split(';')
        .map((c) => c.split('=')[0].trim())
        .filter(Boolean)
    : []
  const cookieNames = Array.from(new Set([...defaultCookieNames, ...documentCookieNames]))

  const host = typeof window !== 'undefined' && window.location ? window.location.hostname : ''
  const domainCandidates = getCookieDomainCandidates(host)
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host === '::1'

  for (const name of cookieNames) {
    // 1. Host-only (no domain specified)
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 UTC; path=/; max-age=0;`
    if (!isLocal) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 UTC; path=/; max-age=0; Secure;`
    }

    // 2. Clear across all candidate domains (preview URL subdomains, .treeder.workers.dev, etc.)
    for (const domain of domainCandidates) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 UTC; path=/; domain=${domain}; max-age=0;`
      if (!isLocal) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 UTC; path=/; domain=${domain}; max-age=0; Secure;`
      }
    }
  }
}

export function signOut() {
  clearClientCookies()
  if (typeof window !== 'undefined') {
    window.location.href = '/signout'
  }
}
