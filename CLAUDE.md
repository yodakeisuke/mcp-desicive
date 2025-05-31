# CLAUDE.md

This file provides guidance to Claude Code when working with this MCP server codebase.

## Commands

### Development
- `npm run dev` - Run MCP server with hot reloading
- `npm run build` - Compile TypeScript to dist/
- `npm run start` - Run compiled MCP server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check without emit

### Testing & Validation
Always run before considering work complete:
- `npm run lint` && `npm run typecheck` && `npm run build`

## Core Philosophy

**Process-Centric Worldview**: "世界はモノの集まりではなく、プロセス（関係）の網である"

### Architectural Principles
1. **Event-Centric Domain Driven Design** - Commands produce events, not side effects
2. **Functional Domain Modeling** - Complete rejection of class-based OOP
3. **Ubiquitous Language Mapping** - Code as domain knowledge documentation
4. **One Business Rule = One Function** - Compose complex rules from simple ones

### Domain Structure
```
src/domain/
├── command/          # Commands that produce events (業務フロー)
├── read/             # Read models/projections (ビュー)
└── term/             # Domain vocabulary (ドメイン語彙)
```
#### term の種類
```
term = 
   operation  # Business procedures (業務手順)
   | resource    # Business resources (業務資源)  
   | policy      # Business policies (業務ポリシー)
   | value       # Value objects (値)
```

## Domain Mapping
- 以下に、ドメイン集約とドメイン語彙のテンプレートを示す。
  - `.claude/template/term`
  - `.claude/template/aggregate`

## Implementation Rules

### Type System
- **ADTs with Tagged Unions**: `type Status = { type: 'Active' } | { type: 'Inactive' }`
- **Branded Types**: `type UserId = ID<'User'>` with smart constructors
- **Exhaustive Matching**: `default: throw new Error(value satisfies never)`

### Error Handling
- **Never throw exceptions** - Use `neverthrow` Result types
- **Native neverthrow usage**: Use `ResultAsync` instead of `Promise<Result>`
- **Function Composition**: Chain with `.andThen()`, `.combine()`, `.mapErr()`
- **Strict composition rule**: All logic MUST be function composition (sequential or parallel)
- **No imperative control flow**: Avoid if/else, try/catch, loops in favor of monadic composition

### Domain Rules
- **No Zod in domain layer** - Only at API boundaries
- **No barrel exports** - Direct imports: `import { PrTask } from '../term/task/prTask.js'`
- **Pure domain operations** - Side effects only in infrastructure layer
- **eDSL composition** - Monadic (sequential) and Applicative (parallel)

### Key Domain Concepts
- **PrTask**: Work unit with status transitions (Investigation → InProgress → Review → Done)
- **Plan**: Aggregate organizing tasks for maximum parallelism
- **Line**: Feature branch with parallelism analysis

## Product Context

MCP server orchestrating multiple AI coding agents working in parallel on different features/branches. Provides "one map" visibility and prevents conflicts through intelligent dependency analysis.

## Git Worktree for Parallel Tasks

```bash
# Create dedicated worktree for each task
git worktree add ../<task-dir> <branch-name>
cd ../<task-dir> && claude

# Clean up when done  
git worktree remove ../<task-dir>
```

## Memories
- Delete unnecessary comments
- Never leave legacy code for backward compatibility
- Keep codebase clean and minimal