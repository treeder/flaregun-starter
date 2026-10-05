import { describe, it, expect } from 'vitest'
import { onRequestGet, onRequestPost } from '../functions/signout.js'
import { getCookieDomainCandidates, clearClientCookies, signOut } from '../public/components/auth-utils.js'

describe('Preview URL Cookie Clearing', () => {
  describe('auth-utils getCookieDomainCandidates', () => {
    it('generates preview subdomain and parent domain candidates for workers.dev', () => {
      const candidates = getCookieDomainCandidates('feature-branch.treeder.workers.dev')
      expect(candidates).toEqual([
        'feature-branch.treeder.workers.dev',
        '.feature-branch.treeder.workers.dev',
        'treeder.workers.dev',
        '.treeder.workers.dev',
      ])
      // PSL suffix workers.dev must NOT be included
      expect(candidates).not.toContain('workers.dev')
      expect(candidates).not.toContain('.workers.dev')
    })

    it('handles nested preview subdomains correctly', () => {
      const candidates = getCookieDomainCandidates('v2.feature.treeder.workers.dev')
      expect(candidates).toContain('v2.feature.treeder.workers.dev')
      expect(candidates).toContain('feature.treeder.workers.dev')
      expect(candidates).toContain('treeder.workers.dev')
      expect(candidates).not.toContain('workers.dev')
    })

    it('returns empty array for localhost', () => {
      expect(getCookieDomainCandidates('localhost')).toEqual([])
      expect(getCookieDomainCandidates('localhost:8787')).toEqual([])
    })
  })

  describe('clearClientCookies and signOut', () => {
    it('sets expired cookies for all candidate domains and host', () => {
      const setCookies = []
      // Mock window and document
      const originalWindow = globalThis.window
      const originalDocument = globalThis.document

      globalThis.window = {
        location: {
          hostname: 'my-preview.treeder.workers.dev',
          href: '',
        },
      }
      globalThis.document = {
        get cookie() {
          return 'session=abc; other_cookie=xyz'
        },
        set cookie(val) {
          setCookies.push(val)
        },
      }

      try {
        clearClientCookies()
        // Should have set cookies for session, userId
        expect(setCookies.length).toBeGreaterThan(0)
        expect(setCookies.some((c) => c.startsWith('session=;') && c.includes('treeder.workers.dev'))).toBe(true)
        expect(setCookies.some((c) => c.startsWith('userId=;') && c.includes('my-preview.treeder.workers.dev'))).toBe(
          true,
        )
        // Should NOT clear unrelated cookies
        expect(setCookies.some((c) => c.startsWith('other_cookie=;'))).toBe(false)

        // Test signOut redirects to /signout
        signOut()
        expect(globalThis.window.location.href).toBe('/signout')
      } finally {
        globalThis.window = originalWindow
        globalThis.document = originalDocument
      }
    })
  })

  describe('functions/signout.js endpoint', () => {
    it('clears preview url cookies and parent workers.dev cookies on GET', async () => {
      const c = {
        request: new Request('https://my-preview.treeder.workers.dev/signout', {
          headers: {
            host: 'my-preview.treeder.workers.dev',
            cookie: 'session=secret123; userId=user_abc',
          },
        }),
      }

      const res = await onRequestGet(c)
      expect(res.status).toBe(302)
      expect(res.headers.get('Location')).toBe('/')

      const setCookies = res.headers.getSetCookie?.() || []
      expect(setCookies.length).toBeGreaterThan(0)

      // Must include deletion for parent domain .treeder.workers.dev and treeder.workers.dev
      expect(setCookies.some((c) => c.includes('Domain=treeder.workers.dev'))).toBe(true)
      expect(setCookies.some((c) => c.includes('Domain=.treeder.workers.dev'))).toBe(true)

      // Must include deletion for preview subdomain
      expect(setCookies.some((c) => c.includes('Domain=my-preview.treeder.workers.dev'))).toBe(true)

      // Must include host-only deletion
      expect(setCookies.some((c) => c.startsWith('session=;') && !c.includes('Domain='))).toBe(true)

      // Must clear all target cookies
      for (const name of ['session', 'userId']) {
        expect(setCookies.some((c) => c.startsWith(`${name}=;`))).toBe(true)
      }
    })

    it('handles POST requests identically to GET', async () => {
      const c = {
        request: new Request('https://my-preview.treeder.workers.dev/signout', {
          method: 'POST',
          headers: {
            host: 'my-preview.treeder.workers.dev',
          },
        }),
      }

      const res = await onRequestPost(c)
      expect(res.status).toBe(302)
      expect(res.headers.get('Location')).toBe('/')
      const setCookies = res.headers.getSetCookie?.() || []
      expect(setCookies.some((c) => c.includes('Domain=treeder.workers.dev'))).toBe(true)
    })
  })
})
