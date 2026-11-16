import { describe, it, expect, vi } from 'vitest'
import { CloudflareMailer, ConsoleMailer, formatAppFrom, renderEmailTemplate } from '../functions/services/mailer.js'
import { initRequest } from '../functions/init.js'
import { onRequest as authOnRequest } from '../functions/auth/[[catchall]].js'
import { baseUrl } from './helper.js'

function createMemoryKV() {
  const store = new Map()
  return {
    store,
    async get(key) {
      return store.has(key) ? store.get(key) : null
    },
    async put(key, value) {
      store.set(key, value)
    },
    async delete(key) {
      store.delete(key)
    },
  }
}

describe('CloudflareMailer, ConsoleMailer & formatAppFrom', () => {
  it('formats sender addresses without hardcoding a default and strips header-injection characters', () => {
    expect(formatAppFrom()).toBe('')
    expect(formatAppFrom('   ')).toBe('')
    expect(formatAppFrom('noreply@example.com')).toBe('Flaregun <noreply@example.com>')
    expect(formatAppFrom('Custom <hello@example.com>')).toBe('Custom <hello@example.com>')
    expect(formatAppFrom('noreply@example.com\r\nBcc: attacker@evil.com')).toBe(
      'Flaregun <noreply@example.comBcc: attacker@evil.com>',
    )
  })

  it('throws when CloudflareMailer.send is called without a sender address', async () => {
    const mailer = new CloudflareMailer({ send: vi.fn() }, { logger: { log: () => {} } })
    await expect(mailer.send({ to: 'user@example.com', subject: 'Hi', body: 'Hello' })).rejects.toThrow(/EMAIL_FROM/)
  })

  it('sends structured EmailMessageBuilder payload via Cloudflare send_email binding', async () => {
    const sendMock = vi.fn().mockResolvedValue({ messageId: '<msg-123@example.com>' })
    const mailer = new CloudflareMailer(
      { send: sendMock },
      {
        from: 'noreply@example.com',
        appName: 'Flaregun',
        logger: { log: () => {} },
      },
    )

    const verifyUrl = 'https://flaregun.treeder.workers.dev/auth/email/verify?token=abc123token'
    const res = await mailer.send({
      to: 'builder@example.com',
      subject: 'Sign in to Flaregun',
      body: `<a href="${verifyUrl}">Click here to sign in</a>`,
    })

    expect(res).toEqual({ messageId: '<msg-123@example.com>' })
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(mailer.lastUrl).toBe(verifyUrl)

    const sentPayload = sendMock.mock.calls[0][0]
    expect(sentPayload.to).toBe('builder@example.com')
    expect(sentPayload.from).toBe('Flaregun <noreply@example.com>')
    expect(sentPayload.subject).toBe('Sign in to Flaregun')
    expect(sentPayload.html).toContain('<!DOCTYPE html>')
    expect(sentPayload.html).toContain(verifyUrl)
    expect(sentPayload.text).toContain(verifyUrl)
  })

  it('escapes HTML in renderEmailTemplate and resolves env.EMAIL object', async () => {
    const sendMock = vi.fn().mockResolvedValue({ messageId: 'ok' })
    const mailer = new CloudflareMailer(
      { EMAIL: { send: sendMock } },
      { from: 'Flaregun <noreply@example.com>', logger: { log: () => {} } },
    )

    const html = renderEmailTemplate({
      title: 'Welcome <script>alert(1)</script>',
      content: 'Safe body',
      link: 'https://flaregun.treeder.workers.dev/auth/email/verify?token=1&a=2',
      appName: 'Flaregun',
    })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')

    await mailer.send({
      to: 'user@example.com',
      subject: 'Please verify your order',
      body: 'Items with price < 50 and > 10 at https://example.com/orders/1\nLine two',
    })
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(sendMock.mock.calls[0][0].html).toBe(
      '<p>Items with price &lt; 50 and &gt; 10 at https://example.com/orders/1<br>Line two</p>',
    )
    expect(sendMock.mock.calls[0][0].text).toBe(
      'Items with price < 50 and > 10 at https://example.com/orders/1\nLine two',
    )
  })
})

describe('Production & Preview Email Auth Security', () => {
  it.each([
    ['prod', 'https://flaregun.treeder.workers.dev'],
    ['preview', 'https://feat-branch-flaregun.treeder.workers.dev'],
  ])(
    'uses CloudflareMailer when EMAIL_FROM is set and never leaks magic link in %s response',
    async (envName, origin) => {
      const sendMock = vi.fn().mockResolvedValue({ messageId: '<prod-msg@example.com>' })
      const kv = createMemoryKV()
      const request = new Request(`${origin}/auth/email/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Host: new URL(origin).host,
        },
        body: JSON.stringify({ email: 'Alice@Example.com' }),
      })

      const c = {
        request,
        params: { catchall: ['email', 'start'] },
        env: {
          ENV: envName,
          EMAIL: { send: sendMock },
          EMAIL_FROM: 'noreply@example.com',
          KV: kv,
          D1: {},
          R2: {},
        },
        data: {},
      }

      await initRequest(c)
      expect(c.data.mailer).toBeInstanceOf(CloudflareMailer)
      c.data.d1.first = vi.fn().mockResolvedValue(null)
      c.data.d1.insert = vi.fn().mockImplementation(async (_model, obj) => ({ id: 'usr_123', ...obj }))

      const res = await authOnRequest(c)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual({ message: 'Check your email to continue.' })
      expect(body.link).toBeUndefined()

      expect(sendMock).toHaveBeenCalledTimes(1)
      const emailArg = sendMock.mock.calls[0][0]
      expect(emailArg.to).toBe('alice@example.com')
      expect(emailArg.from).toBe('Flaregun <noreply@example.com>')
      expect(emailArg.html).toContain(`${origin}/auth/email/verify?token=`)
    },
  )

  it('falls back to ConsoleMailer when EMAIL_FROM is not set without leaking link in prod', async () => {
    const sendMock = vi.fn()
    const kv = createMemoryKV()
    const origin = 'https://flaregun.treeder.workers.dev'
    const request = new Request(`${origin}/auth/email/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Host: new URL(origin).host,
      },
      body: JSON.stringify({ email: 'bob@example.com' }),
    })

    const c = {
      request,
      params: { catchall: ['email', 'start'] },
      env: {
        ENV: 'prod',
        EMAIL: { send: sendMock },
        KV: kv,
        D1: {},
        R2: {},
      },
      data: {},
    }

    await initRequest(c)
    expect(c.data.mailer).toBeInstanceOf(ConsoleMailer)
    c.data.d1.first = vi.fn().mockResolvedValue(null)
    c.data.d1.insert = vi.fn().mockImplementation(async (_model, obj) => ({ id: 'usr_456', ...obj }))

    const res = await authOnRequest(c)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ message: 'Check your email to continue.' })
    expect(body.link).toBeUndefined()
    expect(sendMock).not.toHaveBeenCalled()
    expect(c.data.mailer.lastUrl).toContain(`${origin}/auth/email/verify?token=`)
  })
})

describe('End-to-end Auth Hardening on Live Dev Server', () => {
  it('validates email input and HTTP method on /auth/email/start', async () => {
    const getRes = await fetch(`${baseUrl}/auth/email/start`)
    expect(getRes.status).toBe(405)

    const emptyRes = await fetch(`${baseUrl}/auth/email/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '' }),
    })
    expect(emptyRes.status).toBe(400)

    const invalidRes = await fetch(`${baseUrl}/auth/email/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    })
    expect(invalidRes.status).toBe(400)
  })

  it('enforces single-use magic link tokens and blocks open redirects', async () => {
    const missingTokenRes = await fetch(`${baseUrl}/auth/email/verify`, { redirect: 'manual' })
    expect(missingTokenRes.status).toBe(400)

    const email = `single-use-${Date.now()}@example.com`
    const startRes = await fetch(`${baseUrl}/auth/email/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    expect(startRes.status).toBe(200)
    const startData = await startRes.json()
    expect(startData.link).toBeDefined()

    // Attempt open redirect via query param -> must sanitize Location to '/'
    const verifyRes = await fetch(`${startData.link}&redir=${encodeURIComponent('https://evil.example/phish')}`, {
      redirect: 'manual',
    })
    expect(verifyRes.status).toBe(302)
    expect(verifyRes.headers.get('location')).toBe('/')

    // Replaying the exact same verification link must fail with 401
    const replayRes = await fetch(startData.link, { redirect: 'manual' })
    expect(replayRes.status).toBe(401)
  })

  it('blocks unauthenticated passkey registration and cross-user userId spoofing', async () => {
    const unauthNew = await fetch(`${baseUrl}/auth/passkeys/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(unauthNew.status).toBe(401)

    const unauthCreate = await fetch(`${baseUrl}/auth/passkeys/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'victim-user-id', credential: {} }),
    })
    expect(unauthCreate.status).toBe(401)

    // Authenticate as User A, then attempt to register a passkey specifying User B's userId
    const email = `pk-guard-${Date.now()}@example.com`
    const startRes = await fetch(`${baseUrl}/auth/email/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const { link } = await startRes.json()
    const verifyRes = await fetch(link, { redirect: 'manual' })
    const setCookieHeaders = verifyRes.headers.getSetCookie?.() || [verifyRes.headers.get('set-cookie')].filter(Boolean)
    const cookie = setCookieHeaders.map((sc) => sc.split(';')[0]).join('; ')

    const spoofCreate = await fetch(`${baseUrl}/auth/passkeys/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ userId: 'some-other-user-id', credential: {} }),
    })
    expect(spoofCreate.status).toBe(403)

    // API key (agent) requests must not be allowed to manage passkeys
    const keyRes = await fetch(`${baseUrl}/v1/apiKeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ apiKey: { name: 'Passkey Guard Test Key' } }),
    })
    expect(keyRes.status).toBe(201)
    const { apiKey } = await keyRes.json()
    const apiKeyToken = apiKey.key

    const agentNewRes = await fetch(`${baseUrl}/auth/passkeys/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKeyToken}`,
      },
      body: JSON.stringify({}),
    })
    expect(agentNewRes.status).toBe(403)

    const agentCreateRes = await fetch(`${baseUrl}/auth/passkeys/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKeyToken}`,
      },
      body: JSON.stringify({ credential: {} }),
    })
    expect(agentCreateRes.status).toBe(403)
  })
})
