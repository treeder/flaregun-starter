import { bindings, defineConfig, triggers } from 'cf/config'

export default defineConfig((ctx) => {
  if (ctx.isPreview) {
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
          ENV: bindings.text('preview'),
          D1: bindings.d1({
            name: 'flaregun-preview',
          }),
          KV: bindings.kv({}),
          R2: bindings.r2({
            name: 'flaregun-preview',
          }),
          ASSETS: bindings.assets(),
        },
      },
    }
  }
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
        ENV: bindings.text('prod'),
        D1: bindings.d1({
          name: 'flaregun',
        }),
        KV: bindings.kv({}),
        R2: bindings.r2({
          name: 'flaregun',
        }),
        ASSETS: bindings.assets(),
      },
    },
  }
})
