import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { planTool } from './tool/plan/index.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'mcp-worktree',
    version: '0.0.1',
  });

  // Register the plan tool
  server.tool(
    planTool.name,
    planTool.description,
    planTool.parameters,
    planTool.handler
  );

  return server;
}