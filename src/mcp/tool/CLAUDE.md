# MCP Tool Implementation Guide

This guide provides essential patterns for implementing **MCP Tools** with structured output for AI agents.

## Core Philosophy

> "MCPツールは、ドメインロジックをAIエージェントに安全に公開するためのインターフェイス層です"

MCP Tools serve as the bridge between AI agents and domain logic with:
- **Schema-First Design**: Input/output validation with Zod schemas
- **Structured Output**: Both text and structured data responses
- **Domain Integration**: Safe domain operation orchestration
- **Error Handling**: Meaningful feedback to AI agents

## Implementation Steps

1. **Define schemas** for input/output validation in `schema.ts`
2. **Implement handler** for business logic in `handler.ts`
3. **Create prompts** for AI guidance in `prompt.ts`
4. **Export tool** with outputSchema in `index.ts`

## Sample Code Reference

- **Complete Example**: [`_sample-code/mcp-tool-example.ts`](./_sample-code/mcp-tool-example.ts)
- **Production Example**: [`plan/`](./plan/) - Real implementation with structured output

## Key Patterns

### 1. Schema Definition

```typescript
// Input schema
const toolSchema = z.object({
  name: z.string().describe("Tool name"),
  data: z.array(z.string()).describe("Input data")
});

// Output schema (NEW)
const outputSchema = z.object({
  id: z.string().describe("Response ID"),
  result: z.array(z.object({
    name: z.string().describe("Item name"),
    status: z.string().describe("Item status")
  })).describe("Results array")
});

export const toolParams = toolSchema.shape;
export type ToolParams = z.infer<typeof toolSchema>;
```

### 2. Handler with Structured Output

```typescript
export const toolHandler = (args: ToolParams): Promise<CallToolResult> => {
  return domainOperation(args)
    .andThen(result => buildResponse(result))
    .match(
      data => toStructuredCallToolResult(
        [nextAction, JSON.stringify(data.response, null, 2)],
        data.response,
        false
      ),
      error => toCallToolResult([error.message], true)
    );
};
```

### 3. Tool Definition

```typescript
export const tool = {
  name: 'tool-name',
  description: toolDescription,
  parameters: toolParams,
  outputSchema: outputSchema,  // Enable structured output
  handler: toolHandler
};
```

### 4. Server Registration

```typescript
// Server.ts
tools.forEach(tool => {
  if ('outputSchema' in tool && tool.outputSchema) {
    server.registerTool(tool.name, {
      description: tool.description,
      inputSchema: tool.parameters,
      outputSchema: tool.outputSchema.shape,
    }, tool.handler);
  } else {
    server.tool(tool.name, tool.description, tool.parameters, tool.handler);
  }
});
```

## Utilities

```typescript
// Basic response
export const toCallToolResult = (messages: string[], isError: boolean): CallToolResult => ({
  content: messages.map(text => ({ type: "text", text })),
  isError
});

// Structured response
export const toStructuredCallToolResult = (
  messages: string[], 
  structuredContent: any, 
  isError: boolean
): CallToolResult => ({
  content: messages.map(text => ({ type: "text", text })),
  structuredContent,
  isError
});
```

## Benefits

- **Schema Validation**: Automatic response validation
- **Type Safety**: Complete type information for clients
- **AI Integration**: Direct structured data parsing
- **Backward Compatibility**: Text content still included

## File Structure

```
tool/
├── schema.ts      # Input/output schemas
├── handler.ts     # Business logic
├── prompt.ts      # AI guidance
└── index.ts       # Tool export
```

## Domain Integration

```typescript
// Command layer
const result = DomainAggregate.execute(params).mapErr(mapError);

// Read model
const view = readModel.query(data);
const response = transform(view);

// Effect layer
const effect = await sideEffect(data).mapErr(mapError);
```