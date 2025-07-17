# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a minimal MCP (Model Context Protocol) server template designed for rapid development with AI assistance. It provides a pre-organized structure with complete patterns for building MCP tools with structured output support.

## Development Commands

```bash
# Install dependencies
npm install

# Development (with hot reload)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start compiled server
npm run start

# Type checking (without build)
npm run typecheck

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Lint code
npm run lint
```

## Architecture

### Layered Architecture

The codebase follows a clean architecture pattern with three main layers:

1. **MCP Layer** (`src/mcp/`)
   - Handles external communication via Model Context Protocol
   - Tools expose domain operations to AI agents
   - Implements structured output format for both text and data responses

2. **Domain Layer** (`src/domain/`) - Optional but recommended for complex logic
   - `command/`: Command aggregates that produce events
   - `read/`: Read models for queries  
   - `term/`: Shared domain types and value objects

3. **Effect Layer** (`src/effect/`) - Optional for side effects
   - Storage operations, external API calls, etc.

### MCP Tool Pattern

All MCP tools follow this structure:
- `schema.ts`: Zod schemas for input validation and output typing
- `handler.ts`: Business logic orchestration using Result types
- `index.ts`: Tool export with name, description, schemas, and handler

Tools must be registered in `src/mcp/Server.ts` using `server.registerTool()` for structured output support.

### Structured Output

Tools implement MCP's structured output format:
- Return both human-readable text and machine-parseable data
- Use `toStructuredCallToolResult()` utility from `src/mcp/tool/util.ts`
- Output schema defined using Zod for validation

### Error Handling

The template uses `neverthrow` for functional error handling:
- All operations return `Result<T, E>` or `ResultAsync<T, E>`
- Chain operations with `.andThen()`, `.map()`, `.mapErr()`
- Handle final results with `.match(onSuccess, onError)`

## Key Implementation Patterns

### Creating a New Tool

1. Create directory: `src/mcp/tool/your-tool/`
2. Define schemas with Zod (input and output)
3. Implement handler with error handling
4. Export tool definition with outputSchema
5. Register in Server.ts

### Domain Integration

When implementing domain logic:
- Commands validate and produce events
- Read models query and transform data
- Effects handle side effects with Result types

## Reference Documentation

- **MCP Tool Guide**: `src/mcp/tool/CLAUDE.md` - Detailed patterns for tool implementation
- **Example Tool**: `src/mcp/tool/example/` - Working example with structured output
- **Sample Code**: `src/mcp/tool/_sample-code/` - Minimal implementation examples

## Important Notes

- This is an ESM project (`"type": "module"` in package.json)
- TypeScript target is ES2022 with NodeNext modules
- Minimum Node.js version is 18.0.0
- All imports must include `.js` extension for ESM compatibility