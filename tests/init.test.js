import { describe, it, expect } from 'vitest'
import { initRequest } from '../functions/init.js'
import { ConsoleLogger } from 'console-logger'
import { CloudflareLogger, Scheduler, D1, KV, ErrorHandler } from 'flaregun'
import { ConsoleMailer } from '../functions/services/mailer.js'

describe('initRequest', () => {
  it('instantiates services directly on c.data on each request', async () => {
    const c1 = {
      env: { ENV: 'dev', D1: {}, KV: {}, R2: {} },
      request: new Request('http://localhost:8787/v1/status'),
      data: {},
    }
    const c2 = {
      env: { ENV: 'dev', D1: {}, KV: {}, R2: {} },
      request: new Request('http://localhost:8787/v1/status'),
      data: {},
    }
    await initRequest(c1)
    await initRequest(c2)

    expect(c1.data.d1).toBeInstanceOf(D1)
    expect(c1.data.kv).toBeInstanceOf(KV)
    expect(c1.data.errorHandler).toBeInstanceOf(ErrorHandler)
    expect(c1.data.scheduler).toBeInstanceOf(Scheduler)
    expect(c1.data.mailer).toBeInstanceOf(ConsoleMailer)
    expect(c1.data.globals).toBeUndefined()

    expect(c2.data.scheduler).toBeInstanceOf(Scheduler)
    expect(c2.data.scheduler).not.toBe(c1.data.scheduler)
    expect(c2.data.mailer).toBeInstanceOf(ConsoleMailer)
    expect(c2.data.mailer).not.toBe(c1.data.mailer)
  })

  it('detects dev environment for localhost', async () => {
    const c = {
      env: { ENV: 'prod' },
      request: new Request('http://localhost:8787/v1/status'),
      data: {},
    }
    await initRequest(c)
    expect(c.data.env).toBe('dev')
    expect(c.data.logger).toBeInstanceOf(ConsoleLogger)
  })

  it('detects dev environment for 127.0.0.1', async () => {
    const c = {
      env: { ENV: 'prod' },
      request: new Request('http://127.0.0.1:8787/v1/status'),
      data: {},
    }
    await initRequest(c)
    expect(c.data.env).toBe('dev')
    expect(c.data.logger).toBeInstanceOf(ConsoleLogger)
  })

  it('detects dev environment for IPv6 loopback [::1]', async () => {
    const c = {
      env: { ENV: 'prod' },
      request: new Request('http://[::1]:8787/v1/status'),
      data: {},
    }
    await initRequest(c)
    expect(c.data.env).toBe('dev')
    expect(c.data.logger).toBeInstanceOf(ConsoleLogger)
  })

  it('detects dev environment when ENV is dev regardless of request host', async () => {
    const c = {
      env: { ENV: 'dev' },
      request: new Request('https://myapp.com/v1/status'),
      data: {},
    }
    await initRequest(c)
    expect(c.data.env).toBe('dev')
    expect(c.data.logger).toBeInstanceOf(ConsoleLogger)
  })

  it('uses CloudflareLogger and prod env in production', async () => {
    const c = {
      env: { ENV: 'prod' },
      request: new Request('https://myapp.com/v1/status'),
      data: {},
    }
    await initRequest(c)
    expect(c.data.env).toBe('prod')
    expect(c.data.logger).toBeInstanceOf(CloudflareLogger)
  })

  it('does not falsely detect dev when production URL contains loopback in query or path', async () => {
    const c1 = {
      env: { ENV: 'prod' },
      request: new Request('https://myapp.com/search?q=localhost'),
      data: {},
    }
    await initRequest(c1)
    expect(c1.data.env).toBe('prod')
    expect(c1.data.logger).toBeInstanceOf(CloudflareLogger)

    const c2 = {
      env: { ENV: 'prod' },
      request: new Request('https://myapp.com/docs/127.0.0.1'),
      data: {},
    }
    await initRequest(c2)
    expect(c2.data.env).toBe('prod')
    expect(c2.data.logger).toBeInstanceOf(CloudflareLogger)

    const c3 = {
      env: { ENV: 'prod' },
      request: new Request('https://myapp.com/api/test?ref=[::1]'),
      data: {},
    }
    await initRequest(c3)
    expect(c3.data.env).toBe('prod')
    expect(c3.data.logger).toBeInstanceOf(CloudflareLogger)
  })
})
