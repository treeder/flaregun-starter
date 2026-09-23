import { describe, it, expect } from 'vitest'
import { initRequest } from '../functions/init.js'
import { ConsoleLogger } from 'console-logger'
import { CloudflareLogger } from 'flaregun'

describe('initRequest', () => {
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
})
