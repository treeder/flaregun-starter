// Server-side router emulating Cloudflare Pages Functions routing on Cloudflare Workers,
// with additional handlers for queues and scheduled cron events.
import { createWorker } from 'flaregun'

export default createWorker({
  modules: import.meta.glob('../functions/**/*.js'),
})
