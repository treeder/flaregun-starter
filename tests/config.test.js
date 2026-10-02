import { describe, it, expect } from 'vitest'
import configFn from '../cloudflare.config.ts'

describe('cloudflare.config.ts', () => {
  it('uses worker name as prefix for bindings in production', () => {
    const config = configFn({ isPreview: false })
    const workerName = config.worker.name

    expect(workerName).toBe('flaregun')
    expect(config.worker.env.D1.name).toBe(workerName)
    expect(config.worker.env.R2.name).toBe(workerName)
    expect(config.worker.env.ENV.value).toBe('prod')
  })

  it('uses worker name as prefix with -preview suffix in preview', () => {
    const config = configFn({ isPreview: true })
    const workerName = config.worker.name

    expect(workerName).toBe('flaregun')
    expect(config.worker.env.D1.name).toBe(`${workerName}-preview`)
    expect(config.worker.env.R2.name).toBe(`${workerName}-preview`)
    expect(config.worker.env.ENV.value).toBe('preview')
  })
})
