# mcp-decisive

MCP server for WRAP decision-making framework with structured output.

## Installation

Install the package via npm:

```bash
npm install -g mcp-decisive
```

## Configuration

Add the following to your MCP client configuration (e.g., Claude Desktop or other MCP-compatible clients):

```json
{
  "mcpServers": {
    "decisive": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-decisive"
      ]
    }
  }
}
```

## Features
- **WRAP Decision Framework**: Structured decision-making process support
- **Structured Output**: Tools with validated input/output schemas
- **Domain-Driven Design**: Clean architecture with domain, MCP, and effect layers

## Development

For local development:

```bash
# Clone the repository
git clone https://github.com/yodakeisuke/mcp-decisive.git
cd mcp-decisive

# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

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