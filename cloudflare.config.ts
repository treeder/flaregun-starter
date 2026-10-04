import { bindings, defineConfig, triggers } from 'cf/config'

export default defineConfig((ctx) => {
  const name = 'flaregun'
  const isPreview = ctx.isPreview
  const suffix = isPreview ? '-preview' : ''

  return {
    worker: {
      name,
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
      triggers: isPreview
        ? undefined
        : [
            triggers.scheduled({
              schedule: '* * * * *',
            }),
          ],
      env: {
        ENV: bindings.text(isPreview ? 'preview' : 'prod'),
        D1: bindings.d1({
          name: `${name}${suffix}`,
          id: isPreview ? '5059f84f-8f67-4cbb-9d24-49c172950540' : 'd915d5c1-80b6-4485-849c-41226ee2c3d9',
        }),
        KV: bindings.kv({
          id: isPreview ? '9d01ea4278b14dda95c097949a721614' : '5a3c82cd08ff4f3e9ccf2f581e029a96',
        }),
        R2: bindings.r2({
          name: `${name}${suffix}`,
        }),
        ASSETS: bindings.assets(),
      },
    },
  }
})
