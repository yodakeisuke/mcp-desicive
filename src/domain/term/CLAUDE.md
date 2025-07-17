# Term Model Implementation Guide for AI Agents

This guide provides essential patterns for implementing **Term Models** in our Domain-Driven Design architecture. Term models represent the domain vocabulary as executable code.

## Core Philosophy

> "ドメイン語彙 (Domain Vocabulary) をコードで表現する"

Term models serve as the foundational vocabulary of the domain:
- **Ubiquitous Language**: Code that speaks the domain language
- **Type Safety**: Prevent invalid states through the type system
- **Smart Constructors**: Enforce business rules at creation time
- **Immutable Values**: Ensure data integrity through immutability

## Domain Type Classification

Terms are classified into 4 categories:

### 1. **operation** (業務手順)
Business procedures and workflows
- Complex business logic
- Multi-step validation
- State transitions

### 2. **resource** (業務資源)  
Business resources and entities
- Domain entities
- Aggregate roots
- Resource lifecycle

### 3. **policy** (業務ポリシー)
Business policies and rules
- Validation rules
- Business constraints
- Decision logic

### 4. **value** (値)
Value objects and identifiers
- Branded types
- Immutable values
- Smart constructors

## Quick Reference

When implementing a new term model:

1. **Classify the term type** (operation/resource/policy/value)
2. **Define the type structure** with proper branding
3. **Implement smart constructors** with validation
4. **Add business rules** as separate functions
5. **Create public API** with clear naming

常に、上記1~5の全てが必要というわけではない。必要なもののみ作成すること。

Always refer to the sample code and production examples for concrete implementations of these patterns.

## Sample Code Reference

### Complete Term Model Implementation
- **File**: [`./src/domain/term/_sample-code/term-model-example.ts`](./_sample-code/term-model-example.ts)
- **Purpose**: Demonstrates complete term model patterns
- **Key concepts**: Smart constructors, validation, business rules, type safety



## Implementation Patterns

### 1. Branded Type Pattern

Create type-safe identifiers:

```typescript
// Branded type for compile-time safety
type WorkPlanId = string & { readonly _brand: 'WorkPlanId' };

const WorkPlanId = {
  generate: (): WorkPlanId => {
    return `WorkPlan_${Date.now()}_${Math.random().toString(36).substring(2, 11)}` as WorkPlanId;
  },
  
  fromString: (value: string): Result<WorkPlanId, ValidationError> => {
    // Validation logic
    return ok(value as WorkPlanId);
  }
} as const;
```

### 2. Smart Constructor Pattern

Enforce business rules at creation:

```typescript
// Smart constructor with validation
const constructTask: ConstructTask = (params) =>
  validateTaskParams(params)
    .andThen(validParams => 
      createAcceptanceCriteriaFromParams(validParams.acceptanceCriteria)
        .andThen(criteria =>
          ok(createTask({ ...validParams, acceptanceCriteria: criteria }))
        )
    );
```

### 3. Functional Composition Pattern

Build complex operations from simple functions:

```typescript
// Compose validation and creation
const constructWorkPlan: ConstructWorkPlan = (params) =>
  validateWorkPlanParams(params)
    .andThen(() => createTasksFromParams(params.tasks))
    .andThen(tasks => validateTaskDependencies(params.tasks, tasks)
      .map(() => tasks))
    .map(tasks => linkTaskDependencies(params.tasks, tasks))
    .map(tasks => createWorkPlan(params, tasks));
```

### 4. Business Rule Pattern

Separate business rules from implementation:

```typescript
// Business rules as pure functions
const validateWorkPlanName = (name: string): WorkPlanError[] => {
  if (!name || name.trim().length === 0) {
    return [{ type: 'InvalidName', message: 'WorkPlan name is required' }];
  }
  if (name.length < 3) {
    return [{ type: 'InvalidName', message: 'WorkPlan name must be at least 3 characters' }];
  }
  return [];
};
```

### 5. State Transition Pattern

Model valid state transitions:

```typescript
const TaskStatus = {
  canTransition: (current: TaskStatus, next: TaskStatus): boolean => {
    const transitions: Record<string, string[]> = {
      'ToBeRefined': ['Refined', 'Blocked', 'Abandoned'],
      'Refined': ['Implemented', 'Blocked', 'Abandoned'],
      'Implemented': ['Reviewed', 'Blocked', 'Abandoned'],
      // ... other transitions
    };
    
    return transitions[current.type]?.includes(next.type) ?? false;
  }
} as const;
```

## Type Structure Guidelines

### Value Objects
```typescript
/**
 * 語彙「AcceptanceCriterion」
 * domain type: value
 */
type AcceptanceCriterion = {
  readonly scenario: string;
  readonly given: readonly string[];
  readonly when: readonly string[];
  readonly then: readonly string[];
};
```

### Operations
```typescript
/**
 * 語彙「Task」
 * domain type: operation
 */
type Task = {
  readonly id: TaskId;
  readonly title: string;
  readonly status: TaskStatus;
  // ... other properties
};
```

### eDSL (embedded Domain Specific Language)
```typescript
// Define operation signatures
type ConstructTask = (params: RequestedTask) => Result<Task, TaskError[]>;
type UpdateTaskStatus = (task: Task, newStatus: TaskStatus) => Result<Task, TaskError[]>;
```

## Error Handling

### Error Type Definition
```typescript
type TaskError = {
  type: 'InvalidTitle' | 'InvalidDescription' | 'InvalidStatusTransition';
  message: string;
};

const TaskError = {
  create: (type: TaskError['type'], message: string): TaskError => ({ type, message })
} as const;
```

### Validation Pattern
```typescript
const validateTaskParams = (params: RequestedTask): Result<RequestedTask, TaskError[]> => {
  const errors = [
    ...validateTitle(params.title),
    ...validateDescription(params.description),
    ...validateAcceptanceCriteria(params.acceptanceCriteria)
  ];
  return errors.length > 0 ? err(errors) : ok(params);
};
```

## API Design Patterns

### Public API Structure
```typescript
// Export clean, focused APIs
export const TaskModel = {
  create: constructTask,
  updateStatus: updateTaskStatus,
  assignWorktree: assignWorktree
} as const;

export const WorkPlanModel = {
  create: constructWorkPlan
} as const;
```

### Value Object Utilities
```typescript
export const Values = {
  WorkPlanId,
  TaskId,
  TaskStatus,
  AcceptanceCriterion
} as const;
```

## Do's and Don'ts

### Do's ✅
- Use branded types for type safety
- Implement smart constructors with validation
- Separate business rules from implementation
- Use immutable data structures
- Provide clear error messages
- Follow the type classification system

### Don'ts ❌
- Don't use classes for domain logic
- Don't allow invalid states to be created
- Don't put business logic in constructors
- Don't use mutable state
- Don't ignore validation errors
- Don't mix different term types in one module
