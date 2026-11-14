import { hasApiKeyScope } from '../data/apiKeys.js'
import {
  PROMPTS,
  RESOURCES,
  RESOURCE_TEMPLATES,
  executeTool,
  getPrompt,
  listPublicTools,
  readResource,
} from './mcpTools.js'

export const MCP_PROTOCOL_VERSION = '2026-07-28'
export const SUPPORTED_PROTOCOL_VERSIONS = ['2026-07-28', '2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05']
export const SERVER_INFO = {
  name: 'flaregun-mcp',
  version: '1.0.0',
}
export const SERVER_INSTRUCTIONS =
  'Flaregun MCP Server. Use tools to inspect your user profile and manage products, or extend functions/services/mcpTools.js with your own domain tools.'

function stripHostPort(host) {
  if (!host) return ''
  if (host.startsWith('[')) {
    const end = host.indexOf(']')
    return end !== -1 ? host.slice(0, end + 1) : host
  }
  return host.split(':')[0]
}

export function decodeMcpHeaderValue(val) {
  if (typeof val !== 'string') return val
  const match = val.match(/^=\?base64\?([A-Za-z0-9+/=]+)\?=$/)
  if (!match) return val
  try {
    const binary = atob(match[1])
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return val
  }
}

export function validateOrigin(request) {
  const origin = request.headers.get('Origin')
  if (!origin) return null

  try {
    const originUrl = new URL(origin)
    const isLoopback =
      originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1' || originUrl.hostname === '[::1]'
    const hostHeader = request.headers.get('Host') || new URL(request.url).host
    const matchesHost =
      Boolean(hostHeader) &&
      (originUrl.host.toLowerCase() === hostHeader.toLowerCase() ||
        originUrl.hostname.toLowerCase() === stripHostPort(hostHeader).toLowerCase())

    if (!isLoopback && !matchesHost) {
      return 'Forbidden: Invalid Origin header'
    }
    return null
  } catch {
    return 'Forbidden: Malformed Origin header'
  }
}

export function validateMcpHeaders(request, rpc) {
  const protocolVersionHeader = request.headers.get('MCP-Protocol-Version')
  const methodHeader = request.headers.get('Mcp-Method')
  const nameHeader = request.headers.get('Mcp-Name')

  const bodyProtocolVersion = rpc?.params?._meta?.['io.modelcontextprotocol/protocolVersion']

  if (protocolVersionHeader) {
    if (!SUPPORTED_PROTOCOL_VERSIONS.includes(protocolVersionHeader)) {
      return {
        status: 400,
        error: {
          code: -32022,
          message: 'Unsupported protocol version',
          data: {
            supported: SUPPORTED_PROTOCOL_VERSIONS,
            requested: protocolVersionHeader,
          },
        },
      }
    }
    if (bodyProtocolVersion && bodyProtocolVersion !== protocolVersionHeader) {
      return {
        status: 400,
        error: {
          code: -32020,
          message: `Header mismatch: MCP-Protocol-Version '${protocolVersionHeader}' does not match body '${bodyProtocolVersion}'`,
        },
      }
    }
  } else if (bodyProtocolVersion && !SUPPORTED_PROTOCOL_VERSIONS.includes(bodyProtocolVersion)) {
    return {
      status: 400,
      error: {
        code: -32022,
        message: 'Unsupported protocol version',
        data: {
          supported: SUPPORTED_PROTOCOL_VERSIONS,
          requested: bodyProtocolVersion,
        },
      },
    }
  }

  if (methodHeader && methodHeader !== rpc.method) {
    return {
      status: 400,
      error: {
        code: -32020,
        message: `Header mismatch: Mcp-Method '${methodHeader}' does not match body '${rpc.method}'`,
      },
    }
  }

  if (nameHeader && (rpc.method === 'tools/call' || rpc.method === 'prompts/get')) {
    const decodedName = decodeMcpHeaderValue(nameHeader)
    const bodyName = rpc.params?.name
    if (bodyName && decodedName !== bodyName) {
      return {
        status: 400,
        error: {
          code: -32020,
          message: `Header mismatch: Mcp-Name '${decodedName}' does not match body '${bodyName}'`,
        },
      }
    }
  }

  return null
}

function checkMcpAccess(c, isJsonRpc = false) {
  const originError = validateOrigin(c.request)
  if (originError) {
    if (isJsonRpc) {
      return Response.json(
        {
          jsonrpc: '2.0',
          error: { code: -32000, message: originError },
          id: null,
        },
        {
          status: 403,
          headers: { 'MCP-Protocol-Version': MCP_PROTOCOL_VERSION },
        },
      )
    }
    return Response.json({ error: { message: originError } }, { status: 403 })
  }

  if (!c.data.user?.id) {
    const authHeaders = {
      'WWW-Authenticate': 'Bearer realm="Flaregun MCP"',
      'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
    }
    if (isJsonRpc) {
      return Response.json(
        {
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message:
              'Unauthorized. Provide a valid API key via "Authorization: Bearer <key>", "x-api-key: <key>", or "?token=<key>".',
          },
          id: null,
        },
        { status: 401, headers: authHeaders },
      )
    }
    return Response.json(
      {
        error: {
          message:
            'Authentication required. Provide an API key via "Authorization: Bearer <key>", "x-api-key: <key>", or "?token=<key>".',
        },
      },
      { status: 401, headers: authHeaders },
    )
  }

  if (!hasApiKeyScope(c, 'mcp')) {
    if (isJsonRpc) {
      return Response.json(
        {
          jsonrpc: '2.0',
          error: { code: -32003, message: 'Forbidden: API key lacks required "mcp" scope' },
          id: null,
        },
        { status: 403, headers: { 'MCP-Protocol-Version': MCP_PROTOCOL_VERSION } },
      )
    }
    return Response.json({ error: { message: 'Forbidden: API key lacks required "mcp" scope' } }, { status: 403 })
  }

  return null
}

export async function handleMcpGet(c) {
  const denied = checkMcpAccess(c, false)
  if (denied) return denied

  const accept = c.request.headers.get('Accept') || ''
  const url = new URL(c.request.url)
  const token = url.searchParams.get('token') || url.searchParams.get('apiKey') || ''

  if (accept.includes('text/event-stream')) {
    const postEndpoint = token ? `/mcp?token=${encodeURIComponent(token)}` : '/mcp'
    const bodyText = `event: endpoint\ndata: ${postEndpoint}\n\n`
    return new Response(bodyText, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
      },
    })
  }

  const tools = listPublicTools()
  return Response.json(
    {
      name: 'Flaregun MCP Server',
      serverInfo: SERVER_INFO,
      protocolVersion: MCP_PROTOCOL_VERSION,
      supportedProtocolVersions: SUPPORTED_PROTOCOL_VERSIONS,
      status: 'online',
      authenticatedAs: {
        id: c.data.user.id,
        name: c.data.user.name || c.data.user.email || 'User',
        email: c.data.user.email || null,
      },
      toolsCount: tools.length,
      resourcesCount: RESOURCES.length,
      promptsCount: PROMPTS.length,
      instructions: 'Connect via any MCP client using endpoint "/mcp" with an API key generated in /settings.',
    },
    {
      headers: {
        'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
      },
    },
  )
}

export async function handleMcpDelete(c) {
  const denied = checkMcpAccess(c, false)
  if (denied) return denied

  return new Response(null, {
    status: 204,
    headers: {
      'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
    },
  })
}

export async function handleMcpPost(c) {
  const denied = checkMcpAccess(c, true)
  if (denied) return denied

  const baseHeaders = { 'MCP-Protocol-Version': MCP_PROTOCOL_VERSION }

  let rpc
  try {
    rpc = await c.request.json()
  } catch {
    return Response.json(
      {
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error: Invalid JSON' },
        id: null,
      },
      { status: 400, headers: baseHeaders },
    )
  }

  if (!rpc || typeof rpc !== 'object') {
    return Response.json(
      {
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request: payload must be a JSON object or batch array' },
        id: null,
      },
      { status: 400, headers: baseHeaders },
    )
  }

  if (Array.isArray(rpc)) {
    if (rpc.length === 0) {
      return Response.json(
        {
          jsonrpc: '2.0',
          error: { code: -32600, message: 'Invalid Request: empty batch' },
          id: null,
        },
        { status: 400, headers: baseHeaders },
      )
    }

    const responses = []
    for (const item of rpc) {
      if (
        !item ||
        typeof item !== 'object' ||
        Array.isArray(item) ||
        item.jsonrpc !== '2.0' ||
        typeof item.method !== 'string'
      ) {
        responses.push({
          jsonrpc: '2.0',
          id: item?.id ?? null,
          error: { code: -32600, message: 'Invalid Request: each batch item must be a valid JSON-RPC 2.0 object' },
        })
        continue
      }

      const headerErr = validateMcpHeaders(c.request, item)
      if (headerErr) {
        responses.push({
          jsonrpc: '2.0',
          id: item.id ?? null,
          error: headerErr.error,
        })
        continue
      }

      const itemRes = await handleRpcItem(c, item)
      if (itemRes && !itemRes.isNotification) {
        responses.push({
          jsonrpc: '2.0',
          id: item.id ?? null,
          ...(itemRes.error ? { error: itemRes.error } : { result: itemRes.result }),
        })
      }
    }

    if (responses.length === 0) {
      return new Response(null, { status: 202, headers: baseHeaders })
    }
    return Response.json(responses, { headers: baseHeaders })
  }

  if (rpc.jsonrpc !== '2.0' || typeof rpc.method !== 'string') {
    return Response.json(
      {
        jsonrpc: '2.0',
        id: rpc.id ?? null,
        error: { code: -32600, message: 'Invalid Request: jsonrpc "2.0" and string method are required' },
      },
      { status: 400, headers: baseHeaders },
    )
  }

  const headerErr = validateMcpHeaders(c.request, rpc)
  if (headerErr) {
    return Response.json(
      {
        jsonrpc: '2.0',
        id: rpc.id ?? null,
        error: headerErr.error,
      },
      { status: headerErr.status || 400, headers: baseHeaders },
    )
  }

  const response = await handleRpcItem(c, rpc)
  if (!response || response.isNotification) {
    return new Response(null, { status: 202, headers: baseHeaders })
  }

  if (response.error) {
    return Response.json(
      {
        jsonrpc: '2.0',
        id: rpc.id ?? null,
        error: response.error,
      },
      { status: response.status || 400, headers: baseHeaders },
    )
  }

  return Response.json(
    {
      jsonrpc: '2.0',
      id: rpc.id ?? null,
      result: response.result,
    },
    { headers: baseHeaders },
  )
}

async function handleRpcItem(c, rpc) {
  const { id, method, params } = rpc
  const isNotification = id === undefined || method.startsWith('notifications/')

  // 1. server/discover (MCP 2026-07-28 stateless discovery)
  if (method === 'server/discover') {
    return {
      result: {
        resultType: 'complete',
        supportedVersions: SUPPORTED_PROTOCOL_VERSIONS,
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false },
          prompts: { listChanged: false },
        },
        _meta: {
          'io.modelcontextprotocol/serverInfo': SERVER_INFO,
        },
        instructions: SERVER_INSTRUCTIONS,
        ttlMs: 3600000,
        cacheScope: 'private',
      },
    }
  }

  // 2. initialize (version negotiation & capability handshake)
  if (method === 'initialize') {
    const clientVersion = params?.protocolVersion
    const negotiatedVersion =
      clientVersion && SUPPORTED_PROTOCOL_VERSIONS.includes(clientVersion) ? clientVersion : MCP_PROTOCOL_VERSION

    return {
      result: {
        protocolVersion: negotiatedVersion,
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false },
          prompts: { listChanged: false },
        },
        serverInfo: SERVER_INFO,
        _meta: {
          'io.modelcontextprotocol/serverInfo': SERVER_INFO,
        },
        instructions: SERVER_INSTRUCTIONS,
      },
    }
  }

  // 3. Notifications (e.g. notifications/initialized, notifications/cancelled)
  if (isNotification) {
    return { isNotification: true }
  }

  // 4. ping
  if (method === 'ping') {
    return { result: {} }
  }

  // 5. tools/list
  if (method === 'tools/list') {
    return {
      result: {
        tools: listPublicTools(),
      },
    }
  }

  // 6. tools/call
  if (method === 'tools/call') {
    const toolName = params?.name
    if (!toolName || typeof toolName !== 'string') {
      return {
        status: 400,
        error: { code: -32602, message: 'Invalid params: tool "name" is required' },
      }
    }

    const toolArgs = params?.arguments && typeof params.arguments === 'object' ? params.arguments : {}
    try {
      const toolResult = await executeTool(c, toolName, toolArgs)
      if (!toolResult) {
        return {
          status: 400,
          error: { code: -32602, message: `Unknown tool: ${toolName}` },
        }
      }
      return {
        result: {
          content: toolResult.content,
          isError: Boolean(toolResult.isError),
        },
      }
    } catch (err) {
      return {
        result: {
          content: [
            {
              type: 'text',
              text: `Error executing ${toolName}: ${err.message || String(err)}`,
            },
          ],
          isError: true,
        },
      }
    }
  }

  // 7. resources/list
  if (method === 'resources/list') {
    return {
      result: {
        resources: RESOURCES,
      },
    }
  }

  // 8. resources/templates/list
  if (method === 'resources/templates/list') {
    return {
      result: {
        resourceTemplates: RESOURCE_TEMPLATES,
      },
    }
  }

  // 9. resources/read
  if (method === 'resources/read') {
    const uri = params?.uri
    if (!uri || typeof uri !== 'string') {
      return {
        status: 400,
        error: { code: -32602, message: 'Invalid params: resource "uri" is required' },
      }
    }
    const content = await readResource(c, uri)
    if (!content) {
      return {
        status: 404,
        error: { code: -32002, message: `Resource not found: ${uri}` },
      }
    }
    return {
      result: {
        contents: [content],
      },
    }
  }

  // 10. prompts/list
  if (method === 'prompts/list') {
    return {
      result: {
        prompts: PROMPTS,
      },
    }
  }

  // 11. prompts/get
  if (method === 'prompts/get') {
    const promptName = params?.name
    if (!promptName || typeof promptName !== 'string') {
      return {
        status: 400,
        error: { code: -32602, message: 'Invalid params: prompt "name" is required' },
      }
    }
    const promptArgs = params?.arguments && typeof params.arguments === 'object' ? params.arguments : {}
    const prompt = await getPrompt(c, promptName, promptArgs)
    if (!prompt) {
      return {
        status: 400,
        error: { code: -32602, message: `Unknown prompt: ${promptName}` },
      }
    }
    return {
      result: prompt,
    }
  }

  return {
    status: 404,
    error: {
      code: -32601,
      message: `Method not found: ${method}`,
    },
  }
}
