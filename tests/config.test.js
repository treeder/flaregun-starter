import { describe, it, expect } from 'vitest'
import configFn from '../cloudflare.config.ts'

describe('cloudflare.config.ts', () => {
  it('uses worker name as prefix for bindings in production without hardcoded EMAIL_FROM', () => {
    const prev = process.env.EMAIL_FROM
    delete process.env.EMAIL_FROM
    try {
      const config = configFn({ isPreview: false })
      const workerName = config.worker.name

      expect(workerName).toBe('flaregun')
      expect(config.worker.env.D1.name).toBe(workerName)
      expect(config.worker.env.D1.id).toBeUndefined()
      expect(config.worker.env.KV.id).toBeUndefined()
      expect(config.worker.env.R2.name).toBe(workerName)
      expect(config.worker.env.ENV.value).toBe('prod')
      expect(config.worker.env.EMAIL.type).toBe('send-email')
      expect(config.worker.env.EMAIL_FROM).toBeUndefined()
    } finally {
      if (prev === undefined) delete process.env.EMAIL_FROM
      else process.env.EMAIL_FROM = prev
    }
  })

  it('uses worker name as prefix with -preview suffix in preview and passes EMAIL_FROM env var when set', () => {
    const prev = process.env.EMAIL_FROM
    process.env.EMAIL_FROM = 'Flaregun <noreply@example.com>'
    try {
      const config = configFn({ isPreview: true })
      const workerName = config.worker.name

      expect(workerName).toBe('flaregun')
      expect(config.worker.env.D1.name).toBe(`${workerName}-preview`)
      expect(config.worker.env.D1.id).toBe('5059f84f-8f67-4cbb-9d24-49c172950540')
      expect(config.worker.env.KV.id).toBe('9d01ea4278b14dda95c097949a721614')
      expect(config.worker.env.R2.name).toBe(`${workerName}-preview`)
      expect(config.worker.env.ENV.value).toBe('preview')
      expect(config.worker.env.EMAIL.type).toBe('send-email')
      expect(config.worker.env.EMAIL_FROM.value).toBe('Flaregun <noreply@example.com>')
    } finally {
      if (prev === undefined) delete process.env.EMAIL_FROM
      else process.env.EMAIL_FROM = prev
    }
  })

  it('configures observability with issue detection enabled', () => {
    const config = configFn({ isPreview: false })
    expect(config.worker.observability).toEqual({
      enabled: true,
      headSamplingRate: 1,
      traces: { enabled: true },
      issues: { enabled: true },
    })
  })
})
