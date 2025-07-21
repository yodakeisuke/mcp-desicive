import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { exampleTool } from './tool/example/index.js';
import { defineIssueTool } from './tool/define-issue/index.js';
import { getCurrentStatusTool } from './tool/get-current-status/index.js';
import { registerOptionsTool } from './tool/resister-options/index.js';
import { createMakeTripwireTool } from './tool/make-tripwire/index.js';
import { identifyIssuePrompt } from './prompt/identify-issue/index.js';
import { widenOptionsPrompt } from './prompt/widen-options/index.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'mcp-decisive',
    version: '0.0.2',
    description: 'MCP server for WRAP decision-making framework with structured output',
  });

  const tools = [
    exampleTool,
    defineIssueTool,
    getCurrentStatusTool,
    registerOptionsTool,
    createMakeTripwireTool(server)
  ];

  tools.forEach(tool => {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.parameters,
        outputSchema: tool.outputSchema.shape,
      },
      tool.handler
    );
  });

  const prompts = [
    identifyIssuePrompt,
    widenOptionsPrompt
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