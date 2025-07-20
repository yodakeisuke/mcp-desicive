import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { exampleTool } from './tool/example/index.js';
import { identifyIssuePrompt } from './prompt/identify-issue/index.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'mcp-template',
    version: '0.0.1',
    description: 'Minimal MCP server template with structured output',
  });

  const tools = [
    exampleTool
  ];

  tools.forEach(tool => {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.parameters,
        outputSchema: tool.outputSchema.shape,
      },
      tool.handler
    );
  });

  const prompts = [
    identifyIssuePrompt
  ];

  prompts.forEach(prompt => {
    server.registerPrompt(
      prompt.name,
      {
        description: prompt.description,
        argsSchema: prompt.parameters,
      },
      prompt.handler
    );
  });

  return server;
}