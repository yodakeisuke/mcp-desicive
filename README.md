# MCP Server Template
A minimal typescript template for building MCP (Model Context Protocol) servers.

## Features
- **Vibe Coding Ready**: Pre-organized directory structure with complete rules and samples
- **Implementation Guide**: Complete CLAUDE.md with patterns and examples

## Quick Start
```bash
# Install dependencies
npm install

# Build the server
npm run build

# Start the server
npm run start
```

## Example Tool
The template includes an `example` tool that demonstrates:

## Adding New Tools
1. Create a new directory in `src/mcp/tool/your-tool/`
2. Add these files:
   - `schema.ts` - Input/output schemas
   - `handler.ts` - Tool logic
   - `index.ts` - Tool export
3. Register the tool in `src/mcp/Server.ts`

## File Structure

```
src/
├── index.ts                    # Server entry point
├── mcp/                        # MCP server layer
│   ├── Server.ts              # MCP server setup
│   └── tool/
│       ├── util.ts            # Response utilities
│       ├── example/           # Example tool
│       │   ├── schema.ts      # Zod schemas
│       │   ├── handler.ts     # Tool handler
│       │   └── index.ts       # Tool export
│       └── CLAUDE.md          # Implementation guide
├── domain/                     # Domain layer (optional)
│   ├── command/               # Command aggregates
│   │   └── your-aggregate/
│   │       ├── aggregate.ts   # Business logic
│   │       └── events.ts      # Domain events
│   ├── read/                  # Read models
│   │   └── your-view/
│   │       ├── index.ts       # Query functions
│   │       └── types.ts       # View types
│   └── term/                  # Domain terms
│       └── types.ts           # Shared domain types
└── effect/                     # Effect layer (optional)
    └── storage/
        └── your-storage.ts    # Side effects
```