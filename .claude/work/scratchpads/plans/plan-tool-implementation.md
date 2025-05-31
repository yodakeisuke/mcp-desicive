# Plan Tool Implementation Plan

## Overview

The plan tool is the strategic planning component of mcp-worktree that enables creation and management of master development plans optimized for parallel execution. It serves both PM-Agents creating top-down plans and Coding Agents creating bottom-up tasks.

## Implementation Phases

### Phase 1: Domain Model Foundation
**Goal**: Establish core value objects and types following functional domain principles

1. **Value Objects** (`src/domain/value/`)
   - `PrTaskId`: Branded type for PR task identification
   - `LineId`: Branded type for development line/branch identification
   - `AgentId`: Branded type for agent identification
   - `PrTaskStatus`: ADT for task status flow
   - `PrTask`: Core task entity with status, description, dependencies
   - `Line`: Development line with associated tasks
   - `Plan`: Aggregate of lines and tasks

2. **Domain Operations** (`src/domain/operation/`)
   - `createPlan`: Initialize new development plan
   - `addLine`: Add development line to plan
   - `addTask`: Add PR task to line
   - `bulkUpdateTasks`: Replace/update multiple tasks
   - `validatePlan`: Ensure plan consistency and parallelism

### Phase 2: MCP Tool Implementation
**Goal**: Create MCP tool interface for plan operations

1. **Tool Definition** (`src/mcp/tool/plan.ts`)
   - Define input schema using Zod
   - Create handler that calls domain operations
   - Implement response formatting

2. **Persistence Layer** (`src/infrastructure/storage/`)
   - JSON file storage for plans
   - Load/save operations with Result types
   - File locking for concurrent access

3. **Server Integration**
   - Register plan tool in MCP server
   - Add to tool listing
   - Wire up request handling

### Phase 3: Advanced Features
**Goal**: Enable sophisticated planning capabilities

1. **Dependency Analysis**
   - Detect task dependencies
   - Optimize for maximum parallelism
   - Identify potential bottlenecks

2. **Plan Validation**
   - Ensure no circular dependencies
   - Validate resource allocation
   - Check task completeness

3. **Bulk Operations**
   - Efficient bulk updates
   - Plan merging capabilities
   - Template support

## Technical Design Decisions

### 1. Plan Structure
```typescript
type Plan = {
  id: PlanId;
  name: string;
  lines: Line[];
  createdAt: Date;
  updatedAt: Date;
};

type Line = {
  id: LineId;
  name: string;
  branch: string;
  tasks: PrTask[];
  dependencies: LineId[];
};

type PrTask = {
  id: PrTaskId;
  title: string;
  description: string;
  status: PrTaskStatus;
  assignedTo?: AgentId;
  dependencies: PrTaskId[];
  estimatedHours?: number;
};
```

### 2. Input Schema
The plan tool accepts:
- `action`: 'create' | 'update' | 'replace'
- `planId`: Optional for updates
- `name`: Plan name
- `lines`: Array of line definitions with tasks

### 3. Storage Format
Plans stored as JSON files:
- Location: `./data/plans/{planId}.json`
- Atomic writes with temp files
- Backup retention

### 4. Error Handling
All operations return Result types:
- `PlanNotFound`
- `InvalidPlanStructure`
- `CircularDependency`
- `StorageError`

## Implementation Schedule

**Week 1**: Domain model and basic operations
- Value objects implementation
- Core domain operations
- Unit tests

**Week 2**: MCP tool and persistence
- Tool implementation
- Storage layer
- Integration with server

**Week 3**: Advanced features and testing
- Dependency analysis
- Validation logic
- End-to-end testing

## Success Criteria

1. **Functional Requirements**
   - Create comprehensive plans with multiple lines
   - Support bulk updates/replanning
   - Enable both PM and Coding Agent workflows

2. **Technical Requirements**
   - Pure functional domain model
   - Result-based error handling
   - No exceptions in domain layer
   - Efficient JSON persistence

3. **Performance Requirements**
   - Handle plans with 100+ tasks
   - Sub-second response times
   - Concurrent access support

## Risk Mitigation

1. **Data Consistency**: Use file locking and atomic writes
2. **Large Plans**: Implement pagination and lazy loading
3. **Complex Dependencies**: Limit dependency depth and provide visualization
4. **Schema Evolution**: Version plans and provide migration utilities

## Next Steps

1. Create detailed API specification
2. Implement value objects with tests
3. Design example plans for testing
4. Set up development environment with test data