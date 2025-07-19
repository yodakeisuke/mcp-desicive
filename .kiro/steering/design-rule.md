# Design Rule - Model Separation

## Overview

This rule enforces strict separation between different types of models in the system architecture and prohibits ambiguous model naming patterns that indicate poor domain understanding.

## Model Types

### Command Models
Models that represent business operations and state changes:
- **Purpose**: Handle business commands and produce domain events
- **Location**: `src/domain/command/[aggregate-name]/`
- **Files**: `aggregate.ts`, `events.ts`, `types.ts`
- **Naming**: Use clear business domain terms (e.g., `DecisionWorkflow`, `OptionEvaluation`)

### Read Models  
Models optimized for queries and data presentation:
- **Purpose**: Provide query-optimized views derived from events
- **Location**: `src/domain/read/[view-name]/`
- **Files**: `index.ts`, `types.ts`
- **Naming**: Describe the view or projection (e.g., `DecisionSummaryView`, `OptionComparisonView`)

### ER Models
Entity-relationship models for data persistence:
- **Purpose**: Define data structure and relationships for storage
- **Location**: Database schema definitions or ORM models
- **Naming**: Reflect data entities (e.g., `Decision`, `Option`, `Evaluation`)

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
// Command Model
const createDecision = (issue: Issue): Result<DecisionCreated, Error> => { ... }
const evaluateOption = (option: Option, criteria: Criteria): Result<OptionEvaluated, Error> => { ... }

// Read Model
const getDecisionSummary = (decisionId: DecisionId): DecisionSummaryView => { ... }

// Domain Types
type DecisionWorkflow = { ... }
type OptionEvaluation = { ... }
```

## Enforcement

### Code Review Checklist
- [ ] No class or function names ending in prohibited suffixes
- [ ] All models clearly categorized as Command, Read, or ER
- [ ] Business concepts expressed in domain language
- [ ] Clear separation of concerns between model types

### Validation Rules
1. **Naming Validation**: Automated checks to reject prohibited naming patterns
2. **Architecture Validation**: Ensure models are in correct directories
3. **Dependency Validation**: Command models don't depend on Read models
4. **Domain Language**: All names use business terminology, not technical jargon

## Rationale

This rule ensures:
1. **Clear Domain Expression**: Models reflect business reality, not technical implementation
2. **Proper Separation**: Each model type has distinct responsibilities
3. **Maintainable Architecture**: Clear boundaries prevent coupling and confusion
4. **Domain-Driven Design**: Business concepts are first-class citizens in the code

When you find yourself wanting to create a "Service" or "Manager", stop and ask: "What business concept am I actually modeling?" The answer will lead to better domain design.