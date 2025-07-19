# Design Rule - Model Separation

## Overview

This rule enforces strict separation between different types of models in the system architecture and prohibits ambiguous model naming patterns that indicate poor domain understanding.

## Architecture Layers

### MCP Layer (`src/mcp/`)
External interface layer for AI agent communication:
- **Purpose**: Expose domain operations via Model Context Protocol
- **Location**: `src/mcp/Server.ts` and `src/mcp/tool/[tool-name]/`
- **Files**: `schema.ts`, `handler.ts`, `index.ts`, `prompt.ts` (optional)
- **Pattern**: Schema-first design with structured output support
- **Integration**: Orchestrates domain operations with Result types

### Domain Layer (`src/domain/`)
Core business logic following DDD principles:

#### Command Models (`src/domain/command/[aggregate-name]/`)
- **Purpose**: Handle business commands and produce domain events
- **Files**: `aggregate.ts`, `events.ts`, `types.ts`
- **Pattern**: Event-centric aggregates with functional composition
- **Philosophy**: 集約は、コマンドを受け取ってイベントを返します

#### Read Models (`src/domain/read/[view-name]/`)
- **Purpose**: Query-optimized views derived from events (CQRS)
- **Files**: `types.ts`, `queries.ts`, `projections.ts`, `index.ts`
- **Pattern**: Event projections with eventual consistency
- **Philosophy**: UIにリターンするデータ構造または、コマンドのinputとなる復元されたstate

#### Term Models (`src/domain/term/`)
- **Purpose**: Domain vocabulary as executable code
- **Files**: `operation.ts`, `resource.ts`, `policy.ts`, `value.ts`
- **Pattern**: Branded types with smart constructors
- **Classification**: 4 domain types (operation/resource/policy/value)

### Effect Layer (`src/effect/`)
Side effects and external system interactions:
- **Purpose**: Isolate side effects from pure domain logic
- **Pattern**: Async operations with Result types
- **Philosophy**: 副作用を分離し、ドメインロジックを純粋に保つ

## Prohibited Patterns

### Forbidden Naming Conventions
The following naming patterns are **STRICTLY PROHIBITED** as they indicate poor domain modeling:

- `*Service` - Indicates procedural thinking instead of domain-driven design
- `*Manager` - Vague responsibility, often a god object anti-pattern
- `*Handler` - Too generic, doesn't express business intent
- `*Controller` - Infrastructure concern, not domain concept
- `*Processor` - Technical implementation detail, not business concept
- `*Utility` - Catch-all for poorly understood responsibilities
- `*Helper` - Indicates missing domain concepts
- `*Facade` - Architectural pattern, not domain model

### Why These Are Forbidden
These naming patterns are evidence of:
1. **Poor domain understanding** - Generic technical terms instead of business concepts
2. **Anemic domain models** - Logic scattered in service classes
3. **Procedural programming** - Missing object-oriented or functional design
4. **Unclear responsibilities** - Vague names hide unclear thinking

## Correct Modeling Approach

### Instead of Services, Use:
- **Command Aggregates**: `createDecision()`, `evaluateOption()`, `finalizeChoice()`
- **Domain Operations**: Functions that express business intent clearly
- **Event Producers**: Pure functions that return domain events

### Instead of Managers, Use:
- **Specific Aggregates**: `DecisionWorkflow`, `OptionEvaluation`
- **Domain Policies**: `EvaluationPolicy`, `DecisionCriteria`
- **Business Rules**: Clear, named business logic functions

### Example of Good vs Bad Naming

**❌ Bad (Prohibited):**
```typescript
class DecisionService {
  processDecision() { ... }
}

class OptionManager {
  handleOptions() { ... }
}

class EvaluationProcessor {
  processEvaluation() { ... }
}
```

**✅ Good (Required):**
```typescript
// Command Model (Event-centric)
const createDecision = (issue: Issue): Result<DecisionCreated, Error> => { ... }
const evaluateOption = (option: Option, criteria: Criteria): Result<OptionEvaluated, Error> => { ... }

// Read Model (Query-optimized)
const getDecisionSummary = (decisionId: DecisionId): DecisionSummaryView => { ... }
const projectDecisionEvents = (events: DomainEvent[]): DecisionView => { ... }

// Term Model (Domain vocabulary)
type DecisionWorkflow = { ... }  // operation
type OptionEvaluation = { ... }  // resource
type EvaluationPolicy = { ... }  // policy
type DecisionId = string & { readonly _brand: 'DecisionId' }  // value

// MCP Tool (External interface)
export const evaluateOptionsHandler = (args: EvaluateOptionsParams): Promise<CallToolResult> => {
  return evaluateOption(args.option, args.criteria)
    .match(
      result => toStructuredCallToolResult([message], result, false),
      error => toCallToolResult([error.message], true)
    );
};
```

## Implementation Patterns

### Functional Error Handling
All operations must use `neverthrow` Result types:
```typescript
import { Result, ok, err } from 'neverthrow';

// All domain operations return Result<T, E>
const validateInput = (input: unknown): Result<ValidInput, ValidationError> => { ... }
const executeCommand = (cmd: Command): Result<DomainEvent[], BusinessError> => { ... }

// Chain operations with .andThen(), .map(), .mapErr()
const processRequest = (request: Request): Result<Response, Error> =>
  validateInput(request)
    .andThen(validInput => executeCommand(validInput))
    .map(events => buildResponse(events))
    .mapErr(error => mapToApiError(error));
```

### Schema-First Design
Use Zod for input/output validation:
```typescript
import { z } from 'zod';

// Define schemas first
const inputSchema = z.object({
  name: z.string().min(1),
  data: z.array(z.string())
});

const outputSchema = z.object({
  id: z.string(),
  result: z.array(z.object({
    status: z.enum(['success', 'error'])
  }))
});

// Types derived from schemas
type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
```

### Domain Type Classification
Follow the 4-type system for term models:
```typescript
// operation (業務手順) - Complex business logic
type CreateDecisionWorkflow = (params: DecisionParams) => Result<Decision, DecisionError[]>;

// resource (業務資源) - Business entities
type Decision = {
  readonly id: DecisionId;
  readonly issue: Issue;
  readonly options: readonly Option[];
};

// policy (業務ポリシー) - Business rules
const validateDecisionCriteria = (criteria: Criteria[]): ValidationResult => { ... }

// value (値) - Value objects with smart constructors
type DecisionId = string & { readonly _brand: 'DecisionId' };
const DecisionId = {
  generate: (): DecisionId => { ... },
  fromString: (value: string): Result<DecisionId, ValidationError> => { ... }
};
```

## Enforcement

### Code Review Checklist
- [ ] No class or function names ending in prohibited suffixes
- [ ] All models clearly categorized by architecture layer
- [ ] Business concepts expressed in domain language
- [ ] Result types used for all operations that can fail
- [ ] Zod schemas defined for all external interfaces
- [ ] Domain types properly classified (operation/resource/policy/value)
- [ ] Clear separation of concerns between layers

### Validation Rules
1. **Naming Validation**: Automated checks to reject prohibited naming patterns
2. **Architecture Validation**: Ensure models are in correct layer directories
3. **Dependency Validation**: Proper layer dependencies (MCP → Domain → Effect)
4. **Domain Language**: All names use business terminology, not technical jargon
5. **Error Handling**: All fallible operations return Result types
6. **Schema Validation**: All external interfaces use Zod schemas

## Rationale

This rule ensures:
1. **Clear Domain Expression**: Models reflect business reality, not technical implementation
2. **Proper Separation**: Each model type has distinct responsibilities
3. **Maintainable Architecture**: Clear boundaries prevent coupling and confusion
4. **Domain-Driven Design**: Business concepts are first-class citizens in the code

When you find yourself wanting to create a "Service" or "Manager", stop and ask: "What business concept am I actually modeling?" The answer will lead to better domain design.