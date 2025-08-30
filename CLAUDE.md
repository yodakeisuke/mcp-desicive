# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**mcp-decisive** implements the WRAP decision-making framework as an MCP (Model Context Protocol) server. It provides AI agents with structured tools and prompts to combat decision-making biases and execute high-quality decision processes.

### Core Purpose
- Addresses the 4 major decision biases: narrow framing, confirmation bias, short-term emotion, and overconfidence
- Implements Chip & Dan Heath's WRAP framework (Widen Options / Reality-Test Assumptions / Attain Distance / Prepare to be Wrong)
- Enables interleaved execution where agents can skip or revisit steps as needed

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
   - **Tools** (`src/mcp/tool/`): Expose domain operations to AI agents
   - **Prompts** (`src/mcp/prompt/`): Guide AI agents through decision processes
   - **Server Registration**: Tools and prompts registered in `src/mcp/Server.ts`

2. **Domain Layer** (`src/domain/`)
   - `command/`: Decision workflow commands (define-issue, option-selection)
   - `read/`: Read models for querying decision state (current-status, options)
   - `term/`: Domain value objects (issue-definition, option, workflow-state)

3. **Effect Layer** (`src/effect/`)
   - File system operations for persisting decision state
   - Storage implementations for issues, options, and workflow state

### Key Decision-Making Tools

Current implementation provides these core tools:

- **define-issue**: Register a decision-making issue with context and constraints
- **get-current-status**: Query the current decision workflow state
- **register-options**: Add options to consider for the current issue  
- **make-tripwire**: Create preparation for being wrong (WRAP's "P" step)

### MCP Tool Pattern

All MCP tools follow this structure:
- `schema.ts`: Zod schemas for input validation and structured output
- `handler.ts`: Business logic using Result types from neverthrow
- `prompt.ts`: Pure prompt strings separated from logic (when applicable)
- `index.ts`: Tool export with name, title, description, parameters, outputSchema, and handler

Tools are registered in `src/mcp/Server.ts` using `server.registerTool()` for structured output support.

### Structured Output

Tools implement MCP's structured output format:
- Return both human-readable text and machine-parseable data
- Use `toStructuredCallToolResult()` utility from `src/mcp/tool/util.ts`
- Output schema defined using Zod for validation
- Enables AI agents to process both textual and structured responses

### Error Handling

Uses `neverthrow` for functional error handling:
- All operations return `Result<T, E>` or `ResultAsync<T, E>`
- Chain operations with `.andThen()`, `.map()`, `.mapErr()`
- Handle final results with `.match(onSuccess, onError)`

## Implementation Guidelines

### Creating New WRAP Tools

1. Create directory: `src/mcp/tool/your-tool/`
2. Define input/output schemas with Zod
3. Extract prompt strings to `prompt.ts` if needed
4. Implement handler with domain integration
5. Export tool definition with outputSchema
6. Register in `src/mcp/Server.ts`

### Adding Decision-Making Prompts

1. Create directory: `src/mcp/prompt/your-prompt/`
2. Define prompt parameters schema
3. Create handler for dynamic prompt generation
4. Extract prompt templates to `prompt.ts`
5. Register in Server.ts using `server.registerPrompt()`

### Domain State Management

The system maintains decision state through:
- **Workflow State**: Current step, issue, and progress tracking
- **Issue Storage**: Registered decision problems with context
- **Options Storage**: Available choices being evaluated

State is persisted via the Effect layer using filesystem operations.

## Architecture Principles

- **Schema-First**: Input/output validation with Zod schemas
- **Domain-Driven**: Clear separation of MCP, domain, and effect concerns
- **Functional Error Handling**: Result types prevent exceptions
- **Prompt Separation**: Pure prompt strings isolated from business logic
- **ESM Compatibility**: All imports require `.js` extension

## Important Technical Notes

- ESM project (`"type": "module"` in package.json)
- TypeScript target: ES2022 with NodeNext modules
- Minimum Node.js version: 18.0.0
- Uses Japanese text in some schemas and prompts (as per domain requirements)