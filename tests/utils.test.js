import { describe, it, expect } from 'vitest'
import { hostname, hostURL, domainLevels, getCookieDomainCandidates, clearAuthCookies } from '../functions/utils.js'

describe('utils', () => {
  describe('hostname', () => {
    it('extracts hostname from host header', () => {
      const c = { request: { headers: new Headers({ host: 'example.com:8787' }) } }
      expect(hostname(c)).toBe('example.com')
    })

    it('extracts hostname from x-forwarded-host header if present', () => {
      const c = {
        request: {
          headers: new Headers({
            host: 'internal.local',
            'x-forwarded-host': 'myapp.workers.dev',
          }),
        },
      }
      expect(hostname(c)).toBe('myapp.workers.dev')
    })
  })

  describe('hostURL', () => {
    it('returns http URL with port for localhost', () => {
      const c = { request: { headers: new Headers({ host: 'localhost:8787' }) } }
      expect(hostURL(c)).toBe('http://localhost:8787')
    })

    it('returns https URL for production host', () => {
      const c = { request: { headers: new Headers({ host: 'example.com' }) } }
      expect(hostURL(c)).toBe('https://example.com')
    })
  })

  describe('domainLevels', () => {
    it('returns 3 for *.workers.dev', () => {
      const c = { request: { headers: new Headers({ host: 'my-project.workers.dev' }) } }
      expect(domainLevels(c)).toBe(3)
    })

    it('returns 3 for *.pages.dev', () => {
      const c = { request: { headers: new Headers({ host: 'my-project.pages.dev' }) } }
      expect(domainLevels(c)).toBe(3)
    })

    it('returns 2 for custom domains ending with workers.dev without dot', () => {
      const c = { request: { headers: new Headers({ host: 'myworkers.dev' }) } }
      expect(domainLevels(c)).toBe(2)
    })

    it('returns 2 for standard custom domains', () => {
      const c = { request: { headers: new Headers({ host: 'app.example.com' }) } }
      expect(domainLevels(c)).toBe(2)
    })

    it('returns 2 for apex custom domains', () => {
      const c = { request: { headers: new Headers({ host: 'example.com' }) } }
      expect(domainLevels(c)).toBe(2)
    })

    it('returns 2 for localhost', () => {
      const c = { request: { headers: new Headers({ host: 'localhost:8787' }) } }
      expect(domainLevels(c)).toBe(2)
    })
  })

  describe('getCookieDomainCandidates', () => {
    it('returns domain candidates for preview URL on workers.dev', () => {
      const candidates = getCookieDomainCandidates('stackrank-preview-123.orgname.workers.dev')
      expect(candidates).toContain('stackrank-preview-123.orgname.workers.dev')
      expect(candidates).toContain('.stackrank-preview-123.orgname.workers.dev')
      expect(candidates).toContain('orgname.workers.dev')
      expect(candidates).toContain('.orgname.workers.dev')
      expect(candidates).not.toContain('workers.dev')
      expect(candidates).not.toContain('.workers.dev')
    })

    it('returns domain candidates for nested preview URL', () => {
      const candidates = getCookieDomainCandidates('pr-123.stackrank.orgname.workers.dev')
      expect(candidates).toContain('pr-123.stackrank.orgname.workers.dev')
      expect(candidates).toContain('stackrank.orgname.workers.dev')
      expect(candidates).toContain('orgname.workers.dev')
      expect(candidates).not.toContain('workers.dev')
    })

    it('returns candidates for custom domains down to 2 levels', () => {
      const candidates = getCookieDomainCandidates('preview.stackrank.com')
      expect(candidates).toContain('preview.stackrank.com')
      expect(candidates).toContain('.preview.stackrank.com')
      expect(candidates).toContain('stackrank.com')
      expect(candidates).toContain('.stackrank.com')
      expect(candidates).not.toContain('com')
    })

    it('returns empty array for localhost and IP addresses', () => {
      expect(getCookieDomainCandidates('localhost:8787')).toEqual([])
      expect(getCookieDomainCandidates('127.0.0.1')).toEqual([])
      expect(getCookieDomainCandidates('192.168.1.5:8787')).toEqual([])
      expect(getCookieDomainCandidates('10.0.0.1')).toEqual([])
      expect(getCookieDomainCandidates('[::1]:8787')).toEqual([])
    })

    it('handles falsy input gracefully', () => {
      expect(getCookieDomainCandidates(null)).toEqual([])
      expect(getCookieDomainCandidates(undefined)).toEqual([])
      expect(getCookieDomainCandidates('')).toEqual([])
      expect(domainLevels(null)).toBe(2)
      expect(domainLevels(undefined)).toBe(2)
      expect(hostname(null)).toBe('')
    })

    it('accepts context object', () => {
      const c = { request: { headers: new Headers({ host: 'my-app.orgname.workers.dev' }) } }
      const candidates = getCookieDomainCandidates(c)
      expect(candidates).toContain('orgname.workers.dev')
    })
  })

  describe('clearAuthCookies', () => {
    it('appends host-only clearing headers for localhost', () => {
      const c = { request: { headers: new Headers({ host: 'localhost:8787' }) } }
      const headers = clearAuthCookies(c)
      const setCookies = headers.getSetCookie?.() || []
      expect(setCookies.length).toBeGreaterThan(0)
      expect(setCookies.some((sc) => sc.startsWith('session=;') && sc.includes('Max-Age=0'))).toBe(true)
      expect(setCookies.some((sc) => sc.startsWith('userId=;') && sc.includes('Max-Age=0'))).toBe(true)
    })

    it('handles host string and falsy input without throwing', () => {
      expect(() => clearAuthCookies(null)).not.toThrow()
      const headers = clearAuthCookies('my-preview.orgname.workers.dev')
      const setCookies = headers.getSetCookie?.() || []
      expect(setCookies.some((sc) => sc.includes('Domain=orgname.workers.dev'))).toBe(true)
    })

    it('appends domain-specific clearing headers for preview URL', () => {
      const c = {
        request: {
          headers: new Headers({
            host: 'starter-preview-123.orgname.workers.dev',
            cookie: 'custom_cookie=value123',
          }),
        },
      }
      const headers = clearAuthCookies(c)
      const setCookies = headers.getSetCookie?.() || []
      expect(setCookies.some((sc) => sc.includes('Domain=orgname.workers.dev'))).toBe(true)
      expect(setCookies.some((sc) => sc.includes('Domain=.orgname.workers.dev'))).toBe(true)
      expect(setCookies.some((sc) => sc.includes('Domain=starter-preview-123.orgname.workers.dev'))).toBe(true)
      // Should NOT clear unrelated cookies
      expect(setCookies.some((sc) => sc.startsWith('custom_cookie=;'))).toBe(false)
    })
  })
})
