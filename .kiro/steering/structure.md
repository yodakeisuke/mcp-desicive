# Project Structure & Organization

## Root Structure

```
src/
├── index.ts                    # Server entry point
├── common/                     # Shared utilities and primitives
├── mcp/                        # MCP server layer
├── domain/                     # Domain layer (business logic)
└── effect/                     # Effect layer (side effects)
```

## MCP Layer (`src/mcp/`)

The MCP server implementation and tool definitions:

```
mcp/
├── Server.ts                   # MCP server setup and tool registration
└── tool/                       # MCP tools
    ├── util.ts                 # Response utilities
    ├── CLAUDE.md               # Implementation guide
    ├── _sample-code/           # Reference implementations
    └── [tool-name]/            # Individual tool directories
        ├── schema.ts           # Input/output schemas
        ├── handler.ts          # Tool logic
        ├── prompt.ts           # AI guidance (optional)
        └── index.ts            # Tool export
```

## Domain Layer (`src/domain/`)

Event-centric domain models following DDD principles:

```
domain/
├── command/                    # Command aggregates
│   └── [aggregate-name]/
│       ├── aggregate.ts        # Business logic functions
│       ├── events.ts           # Domain events
│       └── types.ts            # Domain types
├── read/                       # Read models (views)
│   └── [view-name]/
│       ├── index.ts            # Query functions
│       └── types.ts            # View types
└── term/                       # Domain vocabulary
    ├── operation.ts            # Business operations (eDSL)
    ├── resource.ts             # Business resources
    ├── policy.ts               # Business policies
    └── value.ts                # Value objects
```

## Key Conventions

### File Naming
- Use kebab-case for directories: `decision-workflow/`
- Use PascalCase for types: `DecisionWorkflow`
- Use camelCase for functions: `createDecision`

### Domain Organization
- **Commands**: Business operations that produce events
- **Read Models**: Query-optimized views derived from events
- **Terms**: Atomic domain vocabulary (operations, resources, policies, values)

### MCP Tools
- Each tool gets its own directory under `src/mcp/tool/`
- Always include `schema.ts`, `handler.ts`, and `index.ts`
- Use structured output with both text and JSON responses
- Register tools in `Server.ts`

### Sample Code
- Reference implementations in `_sample-code/` directories
- Complete examples showing patterns and conventions
- Always check samples before implementing new features