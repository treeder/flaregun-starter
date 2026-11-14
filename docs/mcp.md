# Built-In Model Context Protocol (MCP) Server

Every Flaregun Starter app comes with a built-in [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) endpoint at `/mcp`, allowing AI agents (Antigravity, Cursor, Claude Code, Windsurf, Cline) to interact with your application out of the box.

---

## 1. Authentication (API Keys)

Generate a scoped API key in the web UI under **`/settings`** (**MCP & API Keys**), or create one via the REST API while signed in:

```bash
POST /v1/apiKeys
Content-Type: application/json
Cookie: session=...

{
  "apiKey": {
    "name": "Cursor Agent",
    "scopes": ["mcp", "read", "write"]
  }
}
```

Response (`201 Created`):

```json
{
  "apiKey": {
    "id": "...",
    "name": "Cursor Agent",
    "maskedKey": "fg_key_abc1...xyz9",
    "key": "fg_key_...",
    "scopes": ["mcp", "read", "write"]
  }
}
```

Pass the key using any of:

- `Authorization: Bearer <your_api_key>`
- `x-api-key: <your_api_key>`
- `?token=<your_api_key>` (on `/mcp` for SSE clients)

Raw keys are hashed with SHA-256 (`keyHash`) before storage in D1 and KV, so the full token is only returned once upon creation.

---

## 2. Connecting MCP Clients

### Streamable HTTP (Recommended)

```json
{
  "mcpServers": {
    "flaregun": {
      "url": "http://localhost:8787/mcp",
      "headers": {
        "Authorization": "Bearer fg_key_YOUR_API_KEY"
      }
    }
  }
}
```

### SSE Transport

```json
{
  "mcpServers": {
    "flaregun": {
      "url": "http://localhost:8787/mcp?token=fg_key_YOUR_API_KEY",
      "transport": "sse"
    }
  }
}
```

---

## 3. Protocol Support

The `/mcp` endpoint ([`functions/mcp/index.js`](../functions/mcp/index.js) and [`functions/services/mcpServer.js`](../functions/services/mcpServer.js)) supports:

- **Protocol Versions**: `2026-07-28`, `2025-11-25`, `2025-06-18`, `2025-03-26`, `2024-11-05`
- **Transports**: Stateless Streamable HTTP (`POST /mcp`), SSE endpoint discovery (`GET /mcp` with `Accept: text/event-stream`), server status metadata (`GET /mcp`), and session close (`DELETE /mcp`)
- **JSON-RPC Methods**: `server/discover`, `initialize`, `ping`, `tools/list`, `tools/call`, `resources/list`, `resources/templates/list`, `resources/read`, `prompts/list`, `prompts/get`, and JSON-RPC batch arrays

---

## 4. Adding Your Own Tools, Resources & Prompts

Edit [`functions/services/mcpTools.js`](../functions/services/mcpTools.js) to register tools for your app's models. Each tool entry defines its schema and `handler(c, args)` in one place:

```js
export const TOOLS = [
  {
    name: 'myCustomTool',
    title: 'My Custom Tool',
    description: 'Describe what this tool does for AI agents.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Record ID' },
      },
      required: ['id'],
    },
    async handler(c, args) {
      const item = await c.data.d1.get(MyModel, args.id)
      return {
        content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
        isError: false,
      }
    },
  },
]
```
