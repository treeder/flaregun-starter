// Override Response.redirect to return mutable Response objects (fixes workerd immutable header errors)
Response.redirect = function(url, status = 302) {
  return new Response(null, {
    status,
    headers: { 'Location': url }
  })
}

// Server-side router emulating Cloudflare Pages Functions routing on Cloudflare Workers,
// with additional handlers for queues and scheduled cron events.
import { queue } from '../functions/queue.js'
import { scheduled } from '../functions/scheduled.js'

const modules = import.meta.glob('../functions/**/*.js')

// Helper to escape regex special characters except brackets
function escapeRegex(str) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

// Helper to check if middleware path is a prefix of request path
function middlewareMatches(middlewarePath, requestPath) {
  if (middlewarePath === '/') return true
  return requestPath === middlewarePath || requestPath.startsWith(middlewarePath + '/')
}

// Parse modules into middlewares and route endpoints
const middlewares = []
const routes = []

for (const key of Object.keys(modules)) {
  const isMiddleware = key.endsWith('_middleware.js')

  // Normalize path relative to '../functions'
  let relPath = key.replace(/^\.\.\/functions/, '')

  if (isMiddleware) {
    let prefix = relPath.slice(0, -'/_middleware.js'.length)
    if (prefix === '') prefix = '/'

    middlewares.push({
      key,
      prefix,
      importModule: modules[key],
    })
  } else {
    // Skip queue.js and scheduled.js as they are worker event handlers rather than request endpoints
    if (relPath === '/queue.js' || relPath === '/scheduled.js') {
      continue
    }

    let routePath = relPath.replace(/\.js$/, '')
    if (routePath.endsWith('/index')) {
      routePath = routePath.slice(0, -6)
    }
    if (routePath === '/index' || routePath === '') {
      routePath = '/'
    }

    // Parse path segments to build regex and collect param names
    const segments = routePath.split('/').filter(Boolean)
    let regexStr = ''
    const paramNames = []

    for (const segment of segments) {
      if (segment.startsWith('[[') && segment.endsWith(']]')) {
        const name = segment.slice(2, -2)
        paramNames.push({ name, isCatchAll: true })
        regexStr += '(?:/(.*))?'
      } else if (segment.startsWith('[') && segment.endsWith(']')) {
        const name = segment.slice(1, -1)
        paramNames.push({ name, isCatchAll: false })
        regexStr += '/([^/]+)'
      } else {
        regexStr += '/' + escapeRegex(segment)
      }
    }
    if (regexStr === '') {
      regexStr = '/'
    }
    const regex = new RegExp(`^${regexStr}/?$`)

    routes.push({
      key,
      routePath,
      regex,
      paramNames,
      importModule: modules[key],
    })
  }
}

// Sort routes: static segments first, then params, then catchalls
function getSegmentScore(segment) {
  if (segment.startsWith('[[') && segment.endsWith(']]')) {
    return 2 // Catch-all: lowest priority
  }
  if (segment.startsWith('[') && segment.endsWith(']')) {
    return 1 // Parameter: medium priority
  }
  return 0 // Static: highest priority
}

routes.sort((a, b) => {
  const segsA = a.routePath.split('/').filter(Boolean)
  const segsB = b.routePath.split('/').filter(Boolean)
  const minLen = Math.min(segsA.length, segsB.length)
  for (let i = 0; i < minLen; i++) {
    const scoreA = getSegmentScore(segsA[i])
    const scoreB = getSegmentScore(segsB[i])
    if (scoreA !== scoreB) {
      return scoreA - scoreB
    }
  }
  return segsB.length - segsA.length
})

// Sort middlewares by prefix length ascending (root first)
middlewares.sort((a, b) => a.prefix.length - b.prefix.length)

async function resolveHandlers(module, method) {
  const handlerName = 'onRequest' + method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()
  let handler = module[handlerName] || module.onRequest || module.default
  if (!handler) return []
  if (Array.isArray(handler)) return handler
  return [handler]
}

export default {
  async fetch(request, env, ctx) {
    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      return await env.ASSETS.fetch(request)
    }
    const url = new URL(request.url)
    const pathname = url.pathname
    const method = request.method

    const safeDecode = (str) => {
      try {
        return decodeURIComponent(str)
      } catch {
        return str
      }
    }

    // Find matching middlewares and endpoint
    const matchedMiddlewares = middlewares.filter((m) => middlewareMatches(m.prefix, pathname))
    let matchedRoute = null
    let params = {}

    for (const route of routes) {
      const match = pathname.match(route.regex)
      if (match) {
        matchedRoute = route
        let matchIndex = 1
        for (const paramInfo of route.paramNames) {
          const val = match[matchIndex++]
          if (paramInfo.isCatchAll) {
            params[paramInfo.name] = val ? val.split('/').map(safeDecode) : []
          } else {
            params[paramInfo.name] = val ? safeDecode(val) : undefined
          }
        }
        break
      }
    }

    const tasks = matchedMiddlewares.map((m) => ({ type: 'middleware', info: m }))
    if (matchedRoute) {
      tasks.push({ type: 'endpoint', info: matchedRoute })
    }

    const data = {}

    async function runTask(taskIdx, handlerIdx, currentHandlers, req, environment) {
      if (handlerIdx < currentHandlers.length) {
        const handler = currentHandlers[handlerIdx]
        const context = {
          request: req,
          env: environment,
          params,
          data,
          waitUntil: ctx.waitUntil.bind(ctx),
          next: (nextReq, nextEnv) =>
            runTask(taskIdx, handlerIdx + 1, currentHandlers, nextReq || req, nextEnv || environment),
        }
        return await handler(context)
      }

      if (taskIdx < tasks.length) {
        const task = tasks[taskIdx]
        try {
          const module = await task.info.importModule()
          const handlers = await resolveHandlers(module, method)
          return await runTask(taskIdx + 1, 0, handlers, req, environment)
        } catch (err) {
          console.error(`Error executing handler for ${task.info.key}:`, err)
          throw err
        }
      }

      // Reached the end of the chain, fallback to ASSETS
      try {
        const fallbackResponse = await environment.ASSETS.fetch(req)
        if (req.headers.get('Upgrade')?.toLowerCase() === 'websocket' || fallbackResponse.status === 101) {
          return fallbackResponse
        }
        return new Response(fallbackResponse.body, fallbackResponse)
      } catch (e) {
        return new Response(`Not Found: ${e.message}`, { status: 404 })
      }
    }

    return await runTask(0, 0, [], request, env)
  },

  async queue(batch, env, ctx) {
    const c = {
      batch,
      env,
      data: {},
      waitUntil: (promise) => ctx.waitUntil(promise),
      passThroughOnException: () => ctx.passThroughOnException(),
    }
    return await queue(c)
  },

  async scheduled(controller, env, ctx) {
    const c = {
      controller,
      env,
      data: {},
      waitUntil: (promise) => ctx.waitUntil(promise),
      passThroughOnException: () => ctx.passThroughOnException(),
    }
    return await scheduled(c)
  },
}
