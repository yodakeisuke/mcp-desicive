# Technology Stack & Build System

## Core Technologies

- **Runtime**: Node.js 18+ with ES2022 modules
- **Language**: TypeScript with strict mode enabled
- **MCP Framework**: @modelcontextprotocol/sdk v1.15.1
- **Error Handling**: neverthrow for Result types (no exceptions)
- **Schema Validation**: Zod (API layer only, not in domain)
- **Testing**: Vitest with UI support

## Build System

- **Package Manager**: npm
- **Build Tool**: TypeScript compiler (tsc)
- **Dev Server**: tsx with watch mode
- **Linting**: ESLint with TypeScript rules

## Common Commands

```bash
# Development
npm run dev          # Start development server with watch mode
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled server

# Quality Assurance  
npm run lint         # Run ESLint
npm run typecheck    # Type checking without emit
npm test             # Run tests
npm test:ui          # Run tests with UI

# Publishing
npm run prepublishOnly  # Full QA pipeline before publish
```

## Key Dependencies

- **neverthrow**: Functional error handling with Result types
- **zod**: Schema validation and type generation
- **@modelcontextprotocol/sdk**: MCP server implementation

## Architecture Principles

- **Event-Centric DDD**: Commands produce events, not side effects
- **Functional Programming**: No classes, pure functions with composition
- **Result Types**: All operations return Result<T, E> instead of throwing
- **Schema-First**: Input/output validation with structured responses