import { bindings, defineConfig, triggers } from 'cf/config'

export default defineConfig((ctx) => {
  const isPreview = ctx.isPreview
  const suffix = isPreview ? '-preview' : ''

  return {
    worker: {
      name: 'flaregun',
      compatibilityDate: '2026-09-22',
      compatibilityFlags: ['global_fetch_strictly_public'],
      entrypoint: './src/worker.js',
      previewUrls: true,
      placement: {
        mode: 'smart',
      },
      observability: {
        enabled: true,
        headSamplingRate: 1,
        traces: {
          enabled: true,
        },
      },
      triggers: [
        triggers.scheduled({
          schedule: '* * * * *',
        }),
      ],
      env: {
        ENV: bindings.text(isPreview ? 'preview' : 'prod'),
        D1: bindings.d1({
          name: `flaregun${suffix}`,
        }),
        KV: bindings.kv({}),
        R2: bindings.r2({
          name: `flaregun${suffix}`,
        }),
        ASSETS: bindings.assets(),
      },
    },
  }
})
