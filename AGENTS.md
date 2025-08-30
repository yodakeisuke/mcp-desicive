# Repository Guidelines

## Project Structure & Module Organization
- `src/`: TypeScript sources
  - `mcp/Server.ts`: MCP server setup and tool/prompt registration
  - `mcp/tool/<name>/`: tools with `schema.ts`, `handler.ts`, `index.ts`
  - `mcp/prompt/<name>/`: prompts with `schema.ts`, `handler.ts`, `index.ts`
  - `domain/`: domain layer (`command`, `read`, `term`)
  - `effect/`: persistence and side-effects (filesystem-backed store, etc.)
  - `common/`: shared primitives/utilities
- Tests: colocated under `src/**` as `*.test.ts` and `*.integration.test.ts`.
- `dist/`: build output. `bin/`: CLI entry (`bin/mcp-decisive.js`).

## Build, Test, and Development Commands
- `npm run dev`: Start in watch mode via `tsx` (runs `src/index.ts`).
- `npm run build`: Compile TypeScript to `dist/` (`tsc`).
- `npm start`: Run compiled server (`node dist/index.js`).
- `npm test`: Run Vitest in Node environment. `npm run test:ui` for UI runner.
- `npm run lint`: ESLint over `src/**/*.ts`. `npm run typecheck`: TS type check only.

## Coding Style & Naming Conventions
- Language: TypeScript (ESM, Node >= 18). Strict TS; no implicit `any`.
- Indentation: 2 spaces; prefer single quotes; keep imports sorted logically.
- Naming: files/dirs kebab-case; types/interfaces PascalCase; vars/functions camelCase.
- Lint rules: no unused vars (prefix with `_` to ignore), avoid `any` (warn). Run `npm run lint && npm run typecheck` before PRs.

## Testing Guidelines
- Framework: Vitest (`vitest.config.ts`, `environment: 'node'`).
- Location: colocate tests with code. Use `foo.test.ts` for unit and `foo.integration.test.ts` for integration (examples under `src/mcp/tool/...`).
- Run: `npm test` (optionally `vitest -t "define issue"` to filter).
- Keep tests deterministic; mock the `effect/` layer where external I/O is involved.

## Commit & Pull Request Guidelines
- Commits: prefer Conventional Commits for clarity, e.g., `feat: add make-tripwire tool`, `fix: harden current-status schema` (history is terse—please improve).
- PRs: include description, rationale, linked issues, and sample JSON/CLI output if relevant. Update README/knowledge when behavior changes.
- Checks: ensure build, lint, and tests pass locally before requesting review.

## Adding Tools or Prompts
- Tools: create `src/mcp/tool/<name>/{schema.ts,handler.ts,index.ts}` and register in `src/mcp/Server.ts`.
- Prompts: create `src/mcp/prompt/<name>/` with schema/handler and register in `Server.ts`.
- See `src/mcp/tool/example/` for a minimal reference.

