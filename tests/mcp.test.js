import { test, expect } from 'vitest'
import { baseUrl } from './helper.js'

async function signInTestUser(prefix = 'mcp-user') {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`
  const startRes = await fetch(`${baseUrl}/auth/email/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  expect(startRes.status).toBe(200)
  const startData = await startRes.json()

  const verifyRes = await fetch(startData.link, { redirect: 'manual' })
  expect(verifyRes.status).toBe(302)
  const setCookieHeaders = verifyRes.headers.getSetCookie?.() || [verifyRes.headers.get('set-cookie')].filter(Boolean)
  const cookie = setCookieHeaders.map((c) => c.split(';')[0]).join('; ')

  const meRes = await fetch(`${baseUrl}/v1/users/me`, {
    headers: { Cookie: cookie },
  })
  expect(meRes.status).toBe(200)
  const { user } = await meRes.json()
  return { email, cookie, user }
}

test('Unauthenticated /mcp and /v1/apiKeys requests are rejected with 401', async () => {
  const getMcp = await fetch(`${baseUrl}/mcp`)
  expect(getMcp.status).toBe(401)
  expect(getMcp.headers.get('www-authenticate')).toContain('Bearer')

  const postMcp = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
  })
  expect(postMcp.status).toBe(401)
  const postMcpBody = await postMcp.json()
  expect(postMcpBody.error.code).toBe(-32001)

  const listKeys = await fetch(`${baseUrl}/v1/apiKeys`)
  expect(listKeys.status).toBe(401)
})

test('API key lifecycle, MCP protocol transports, tools, resources, prompts, and scopes', async () => {
  const user1 = await signInTestUser('mcp-owner')
  const user2 = await signInTestUser('mcp-other')

  // 1. Create an API key for user1
  const createKeyRes = await fetch(`${baseUrl}/v1/apiKeys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: user1.cookie,
    },
    body: JSON.stringify({
      apiKey: {
        name: 'Antigravity Test Key',
      },
    }),
  })
  expect(createKeyRes.status).toBe(201)
  const createKeyData = await createKeyRes.json()
  const rawKey = createKeyData.apiKey.key
  const keyId = createKeyData.apiKey.id
  expect(rawKey).toMatch(/^fg_key_/)
  expect(createKeyData.apiKey.maskedKey).toContain('fg_key_')
  expect(createKeyData.apiKey.maskedKey).toContain('...')
  expect(createKeyData.apiKey.scopes).toEqual(['mcp', 'read', 'write'])

  // 2. Listing API keys returns maskedKey and never exposes raw key or keyHash
  const listKeysRes = await fetch(`${baseUrl}/v1/apiKeys`, {
    headers: { Cookie: user1.cookie },
  })
  expect(listKeysRes.status).toBe(200)
  const listKeysData = await listKeysRes.json()
  expect(listKeysData.apiKeys.length).toBe(1)
  expect(listKeysData.apiKeys[0].id).toBe(keyId)
  expect(listKeysData.apiKeys[0].key).toBeUndefined()
  expect(listKeysData.apiKeys[0].keyHash).toBeUndefined()

  // 3. Agent keys cannot manage API keys (403) and query ?token= is not accepted on /v1/*
  const agentListKeys = await fetch(`${baseUrl}/v1/apiKeys`, {
    headers: { Authorization: `Bearer ${rawKey}` },
  })
  expect(agentListKeys.status).toBe(403)

  const agentCreateKey = await fetch(`${baseUrl}/v1/apiKeys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
    },
    body: JSON.stringify({ name: 'Escalated Key' }),
  })
  expect(agentCreateKey.status).toBe(403)

  const queryTokenOnV1 = await fetch(`${baseUrl}/v1/users/me?token=${encodeURIComponent(rawKey)}`)
  expect(queryTokenOnV1.status).toBe(401)

  // 4. GET /mcp metadata & 405 for Streamable HTTP SSE stream probes
  const metaRes = await fetch(`${baseUrl}/mcp`, {
    headers: { Authorization: `Bearer ${rawKey}` },
  })
  expect(metaRes.status).toBe(200)
  expect(metaRes.headers.get('mcp-protocol-version')).toBe('2026-07-28')
  const metaData = await metaRes.json()
  expect(metaData.status).toBe('online')
  expect(metaData.protocolVersion).toBe('2026-07-28')
  expect(metaData.supportedProtocolVersions).toEqual(['2026-07-28', '2025-11-25'])
  expect(metaData.authenticatedAs.id).toBe(user1.user.id)
  expect(metaData.toolsCount).toBeGreaterThanOrEqual(6)

  const sseProbeRes = await fetch(`${baseUrl}/mcp`, {
    headers: {
      Authorization: `Bearer ${rawKey}`,
      Accept: 'text/event-stream',
    },
  })
  expect(sseProbeRes.status).toBe(405)
  expect(sseProbeRes.headers.get('allow')).toBe('POST, DELETE')
  expect(sseProbeRes.headers.get('mcp-protocol-version')).toBe('2026-07-28')

  // 5. Origin DNS-rebinding check
  const badOriginRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
      Origin: 'https://evil.example.com',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
  })
  expect(badOriginRes.status).toBe(403)

  const localOriginRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
      Origin: baseUrl,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
  })
  expect(localOriginRes.status).toBe(200)

  // 6. server/discover, initialize, notifications/initialized, and header validation
  const discoverRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': rawKey,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'disc-1', method: 'server/discover' }),
  })
  expect(discoverRes.status).toBe(200)
  const discoverData = await discoverRes.json()
  expect(discoverData.result.resultType).toBe('complete')
  expect(discoverData.result.supportedVersions).toEqual(['2026-07-28', '2025-11-25'])

  const initRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'initialize',
      params: { protocolVersion: '2025-11-25' },
    }),
  })
  expect(initRes.status).toBe(200)
  const initData = await initRes.json()
  expect(initData.result.protocolVersion).toBe('2025-11-25')
  expect(initData.result.serverInfo.name).toBe('flaregun-mcp')

  const notifRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    }),
  })
  expect(notifRes.status).toBe(202)

  const unsupportedVerRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
      'MCP-Protocol-Version': '2024-11-05',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'ping' }),
  })
  expect(unsupportedVerRes.status).toBe(400)
  const unsupportedVerData = await unsupportedVerRes.json()
  expect(unsupportedVerData.error.code).toBe(-32022)
  expect(unsupportedVerData.error.data.supported).toEqual(['2026-07-28', '2025-11-25'])

  const mismatchMethodRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
      'Mcp-Method': 'tools/list',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'ping' }),
  })
  expect(mismatchMethodRes.status).toBe(400)
  const mismatchMethodData = await mismatchMethodRes.json()
  expect(mismatchMethodData.error.code).toBe(-32020)

  // 7. tools/list & tools/call CRUD flow
  const toolsListRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 10, method: 'tools/list' }),
  })
  expect(toolsListRes.status).toBe(200)
  const toolsListData = await toolsListRes.json()
  const toolNames = toolsListData.result.tools.map((t) => t.name)
  expect(toolNames).toEqual(
    expect.arrayContaining([
      'whoami',
      'listProducts',
      'getProduct',
      'createProduct',
      'updateProduct',
      'deleteProduct',
      'listProductReviews',
      'createProductReview',
      'listOrders',
      'getOrder',
      'createOrder',
    ]),
  )
  expect(toolsListData.result.tools[0].handler).toBeUndefined()

  // Base64 sentinel Mcp-Name header with whoami
  const b64Whoami = `=?base64?${Buffer.from('whoami', 'utf8').toString('base64')}?=`
  const whoamiRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
      'Mcp-Method': 'tools/call',
      'Mcp-Name': b64Whoami,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 11,
      method: 'tools/call',
      params: { name: 'whoami', arguments: {} },
    }),
  })
  expect(whoamiRes.status).toBe(200)
  const whoamiData = await whoamiRes.json()
  expect(whoamiData.result.isError).toBe(false)
  const whoamiParsed = JSON.parse(whoamiData.result.content[0].text)
  expect(whoamiParsed.user.id).toBe(user1.user.id)
  expect(whoamiParsed.authMethod).toBe('apiKey')

  // Create product via MCP tool
  const createProdRpc = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 12,
      method: 'tools/call',
      params: {
        name: 'createProduct',
        arguments: {
          name: 'MCP Smart Sensor',
          description: 'Created autonomously via MCP tool call',
          price: 89.5,
          category: 'electronics',
          inStock: true,
          discount: 10,
        },
      },
    }),
  })
  expect(createProdRpc.status).toBe(200)
  const createProdData = await createProdRpc.json()
  expect(createProdData.result.isError).toBe(false)
  const createdProduct = JSON.parse(createProdData.result.content[0].text).product
  expect(createdProduct.name).toBe('MCP Smart Sensor')
  expect(createdProduct.userId).toBe(user1.user.id)

  // Update product via MCP tool
  const updateProdRpc = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 13,
      method: 'tools/call',
      params: {
        name: 'updateProduct',
        arguments: {
          id: createdProduct.id,
          price: 79.0,
          inStock: false,
        },
      },
    }),
  })
  const updateProdData = await updateProdRpc.json()
  expect(updateProdData.result.isError).toBe(false)
  const updatedProduct = JSON.parse(updateProdData.result.content[0].text).product
  expect(updatedProduct.price).toBe(79)
  expect(updatedProduct.data.inStock).toBe(false)

  // List mine via MCP tool (verifies D1 pushdown for search, category, and inStock)
  const listMineRpc = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 14,
      method: 'tools/call',
      params: {
        name: 'listProducts',
        arguments: { scope: 'mine', search: 'Sensor', category: 'Electronics', inStock: false },
      },
    }),
  })
  const listMineData = await listMineRpc.json()
  const listedMine = JSON.parse(listMineData.result.content[0].text)
  expect(listedMine.count).toBe(1)
  expect(listedMine.products[0].id).toBe(createdProduct.id)

  // 8. Resources, Resource Templates, Prompts, and rejection of legacy batch arrays
  const batchRpcRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
    },
    body: JSON.stringify([{ jsonrpc: '2.0', id: 'b1', method: 'ping' }]),
  })
  expect(batchRpcRes.status).toBe(400)
  const batchErrData = await batchRpcRes.json()
  expect(batchErrData.error.code).toBe(-32600)

  const resourcesListRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'r1', method: 'resources/list' }),
  })
  expect(resourcesListRes.status).toBe(200)
  const resourcesListData = await resourcesListRes.json()
  expect(resourcesListData.id).toBe('r1')
  expect(resourcesListData.result.resources.length).toBe(3)

  const resourceReadRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'r2',
      method: 'resources/read',
      params: { uri: `flaregun://products/${createdProduct.id}` },
    }),
  })
  expect(resourceReadRes.status).toBe(200)
  const resourceReadData = await resourceReadRes.json()
  expect(resourceReadData.id).toBe('r2')
  expect(JSON.parse(resourceReadData.result.contents[0].text).product.id).toBe(createdProduct.id)

  const promptGetRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'p1',
      method: 'prompts/get',
      params: { name: 'summarizeCatalog', arguments: { category: 'electronics' } },
    }),
  })
  expect(promptGetRes.status).toBe(200)
  const promptGetData = await promptGetRes.json()
  expect(promptGetData.id).toBe('p1')
  expect(promptGetData.result.messages[0].content.text).toContain('MCP Smart Sensor')

  // 8b. MCP reviews and orders tools work end-to-end
  const restockRpc = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'restock-1',
      method: 'tools/call',
      params: {
        name: 'updateProduct',
        arguments: { id: createdProduct.id, inStock: true, stockCount: 5 },
      },
    }),
  })
  expect((await restockRpc.json()).result.isError).toBe(false)

  const reviewRpc = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: user2.cookie,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'rev-1',
      method: 'tools/call',
      params: {
        name: 'createProductReview',
        arguments: {
          productId: createdProduct.id,
          rating: 5,
          title: 'Awesome MCP sensor',
          body: 'Works great over Zigbee and Thread.',
        },
      },
    }),
  })
  const reviewData = await reviewRpc.json()
  expect(reviewData.result.isError).toBe(false)
  expect(JSON.parse(reviewData.result.content[0].text).summary.ratingAvg).toBe(5)

  const orderRpc = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: user2.cookie,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'ord-1',
      method: 'tools/call',
      params: {
        name: 'createOrder',
        arguments: {
          items: [{ productId: createdProduct.id, quantity: 2 }],
          customerName: 'User Two',
          shippingAddress: '500 Market St, San Francisco, CA',
        },
      },
    }),
  })
  const orderRpcData = await orderRpc.json()
  expect(orderRpcData.result.isError).toBe(false)
  const createdOrder = JSON.parse(orderRpcData.result.content[0].text).order
  expect(createdOrder.orderNumber).toMatch(/^FG-/)

  // User 1 cannot read User 2's order via MCP getOrder
  const crossOrderRpc = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'ord-cross',
      method: 'tools/call',
      params: { name: 'getOrder', arguments: { id: createdOrder.id } },
    }),
  })
  expect((await crossOrderRpc.json()).result.isError).toBe(true)

  // 9. Per-user isolation & read-only scope enforcement
  // User 2 cannot revoke User 1's key
  const crossRevoke = await fetch(`${baseUrl}/v1/apiKeys/${keyId}`, {
    method: 'DELETE',
    headers: { Cookie: user2.cookie },
  })
  expect(crossRevoke.status).toBe(403)

  // User 2 cannot delete User 1's product, and cannot read User 1's private draft
  const user2DeleteOther = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: user2.cookie,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'del-other',
      method: 'tools/call',
      params: { name: 'deleteProduct', arguments: { id: createdProduct.id } },
    }),
  })
  expect((await user2DeleteOther.json()).result.isError).toBe(true)

  await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'draft-1',
      method: 'tools/call',
      params: { name: 'updateProduct', arguments: { id: createdProduct.id, published: false } },
    }),
  })

  const user2GetPrivate = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: user2.cookie,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 20,
      method: 'tools/call',
      params: { name: 'getProduct', arguments: { id: createdProduct.id } },
    }),
  })
  const user2GetData = await user2GetPrivate.json()
  expect(user2GetData.result.isError).toBe(true)

  // Read-only key and mcp-only key (without explicit 'write') cannot call write tools or mutating /v1/* endpoints
  const roKeyRes = await fetch(`${baseUrl}/v1/apiKeys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: user1.cookie,
    },
    body: JSON.stringify({ name: 'Read Only Agent', scopes: ['mcp', 'read'] }),
  })
  expect(roKeyRes.status).toBe(201)
  const roKey = (await roKeyRes.json()).apiKey.key

  const mcpOnlyKeyRes = await fetch(`${baseUrl}/v1/apiKeys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: user1.cookie,
    },
    body: JSON.stringify({ name: 'MCP Only Agent', scopes: ['mcp'] }),
  })
  expect(mcpOnlyKeyRes.status).toBe(201)
  const mcpOnlyKey = (await mcpOnlyKeyRes.json()).apiKey.key

  const mcpOnlyWriteRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mcpOnlyKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'mcp-only-write',
      method: 'tools/call',
      params: { name: 'createProduct', arguments: { name: 'Should Fail' } },
    }),
  })
  const mcpOnlyWriteData = await mcpOnlyWriteRes.json()
  expect(mcpOnlyWriteData.result.isError).toBe(true)
  expect(mcpOnlyWriteData.result.content[0].text).toContain('write')

  const roWriteMcp = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 21,
      method: 'tools/call',
      params: { name: 'deleteProduct', arguments: { id: createdProduct.id } },
    }),
  })
  const roWriteData = await roWriteMcp.json()
  expect(roWriteData.result.isError).toBe(true)
  expect(roWriteData.result.content[0].text).toContain('write')

  const roWriteRest = await fetch(`${baseUrl}/v1/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roKey}`,
    },
    body: JSON.stringify({ product: { name: 'Blocked Write' } }),
  })
  expect(roWriteRest.status).toBe(403)

  // Delete product with full key
  const deleteProdRpc = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 22,
      method: 'tools/call',
      params: { name: 'deleteProduct', arguments: { id: createdProduct.id } },
    }),
  })
  const deleteProdData = await deleteProdRpc.json()
  expect(deleteProdData.result.isError).toBe(false)

  // DELETE /mcp returns 204
  const delSessionRes = await fetch(`${baseUrl}/mcp`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${rawKey}` },
  })
  expect(delSessionRes.status).toBe(204)

  // 10. Revoking API key invalidates access immediately
  const revokeRes = await fetch(`${baseUrl}/v1/apiKeys/${keyId}`, {
    method: 'DELETE',
    headers: { Cookie: user1.cookie },
  })
  expect(revokeRes.status).toBe(200)

  const afterRevokeMcp = await fetch(`${baseUrl}/mcp`, {
    headers: { Authorization: `Bearer ${rawKey}` },
  })
  expect(afterRevokeMcp.status).toBe(401)
})

test('Settings UI includes api-keys-card component built with Material 3 controls', async () => {
  const settingsJsRes = await fetch(`${baseUrl}/components/settings-page.js`)
  expect(settingsJsRes.status).toBe(200)
  const settingsJs = await settingsJsRes.text()
  expect(settingsJs).toContain("import '/components/api-keys-card.js'")
  expect(settingsJs).toContain('<api-keys-card></api-keys-card>')

  const cardJsRes = await fetch(`${baseUrl}/components/api-keys-card.js`)
  expect(cardJsRes.status).toBe(200)
  const cardJs = await cardJsRes.text()
  expect(cardJs).toContain("customElements.define('api-keys-card', ApiKeysCard)")
  expect(cardJs).toContain('<md-card')
  expect(cardJs).toContain('<md-button')
  expect(cardJs).toContain('<md-text-field')
  expect(cardJs).toContain('role="status"')
})
