import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'

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
