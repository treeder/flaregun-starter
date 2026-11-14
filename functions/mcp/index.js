import {
  MCP_PROTOCOL_VERSION,
  SERVER_INFO,
  SUPPORTED_PROTOCOL_VERSIONS,
  handleMcpDelete,
  handleMcpGet,
  handleMcpPost,
} from '../services/mcpServer.js'
import { PROMPTS, RESOURCES, RESOURCE_TEMPLATES, TOOLS, listPublicTools } from '../services/mcpTools.js'

export {
  MCP_PROTOCOL_VERSION,
  PROMPTS,
  RESOURCES,
  RESOURCE_TEMPLATES,
  SERVER_INFO,
  SUPPORTED_PROTOCOL_VERSIONS,
  TOOLS,
  listPublicTools,
}

export const onRequestGet = handleMcpGet
export const onRequestPost = handleMcpPost
export const onRequestDelete = handleMcpDelete
