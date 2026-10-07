import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'

if (process.env.CLOUDFLARE_PREVIEW_BUILD === 'true') {
  process.env.CLOUDFLARE_VITE_PREVIEW_BUILD = 'true'
}

export default defineConfig({
  plugins: [cloudflare()],
  server: {
    port: 8787,
    hmr: {
      port: 8787,
    },
    cors: {
      origin: true,
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    },
  },
})
