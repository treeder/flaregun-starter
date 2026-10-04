import { describe, it, expect } from 'vitest'
import configFn from '../cloudflare.config.ts'

describe('cloudflare.config.ts', () => {
  it('uses worker name as prefix for bindings in production', () => {
    const config = configFn({ isPreview: false })
    const workerName = config.worker.name

    expect(workerName).toBe('flaregun')
    expect(config.worker.env.D1.name).toBe(workerName)
    expect(config.worker.env.D1.id).toBe('d915d5c1-80b6-4485-849c-41226ee2c3d9')
    expect(config.worker.env.KV.id).toBe('5a3c82cd08ff4f3e9ccf2f581e029a96')
    expect(config.worker.env.R2.name).toBe(workerName)
    expect(config.worker.env.ENV.value).toBe('prod')
  })

  it('uses worker name as prefix with -preview suffix in preview', () => {
    const config = configFn({ isPreview: true })
    const workerName = config.worker.name

    expect(workerName).toBe('flaregun')
    expect(config.worker.env.D1.name).toBe(`${workerName}-preview`)
    expect(config.worker.env.D1.id).toBe('5059f84f-8f67-4cbb-9d24-49c172950540')
    expect(config.worker.env.KV.id).toBe('9d01ea4278b14dda95c097949a721614')
    expect(config.worker.env.R2.name).toBe(`${workerName}-preview`)
    expect(config.worker.env.ENV.value).toBe('preview')
  })
})
