# Plan Tool Design Document

## Purpose

The plan tool enables creation and management of master development plans, maximizing parallel execution opportunities while maintaining clear task dependencies and progress tracking.

## Domain Model Design

### Core Value Objects

#### 1. PrTaskId
```typescript
// Branded type for type-safe task identification
type PrTaskId = string & { readonly _brand: unique symbol };

const PrTaskId = {
  create: (value: string): Result<PrTaskId, ValidationError> => {
    if (!value || value.length < 3) {
      return err(new ValidationError('PrTaskId must be at least 3 characters'));
    }
    return ok(value as PrTaskId);
  },
  
  generate: (): PrTaskId => {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as PrTaskId;
  }
};
```

#### 2. PrTaskStatus ADT
```typescript
type PrTaskStatus =
  | { type: 'Investigation' }
  | { type: 'InProgress' }
  | { type: 'Review' }
  | { type: 'Done' }
  | { type: 'Blocked'; reason: string; since: Date }
  | { type: 'Abandoned'; reason: string; at: Date };

const PrTaskStatus = {
  investigation: (): PrTaskStatus => ({ type: 'Investigation' }),
  inProgress: (): PrTaskStatus => ({ type: 'InProgress' }),
  review: (): PrTaskStatus => ({ type: 'Review' }),
  done: (): PrTaskStatus => ({ type: 'Done' }),
  blocked: (reason: string): PrTaskStatus => ({ type: 'Blocked', reason, since: new Date() }),
  abandoned: (reason: string): PrTaskStatus => ({ type: 'Abandoned', reason, at: new Date() }),
  
  // Status transition validation
  canTransition: (from: PrTaskStatus, to: PrTaskStatus): boolean => {
    if (from.type === 'Done') return false; // Terminal state
    if (to.type === 'Blocked' || to.type === 'Abandoned') return from.type !== 'Done';
    
    const validTransitions: Record<string, string[]> = {
      'Investigation': ['InProgress', 'Blocked', 'Abandoned'],
      'InProgress': ['Review', 'Blocked', 'Abandoned'],
      'Review': ['Done', 'InProgress', 'Blocked', 'Abandoned'],
      'Blocked': ['Investigation', 'InProgress', 'Review', 'Abandoned'],
      'Abandoned': [] // Terminal state
    };
    
    return validTransitions[from.type]?.includes(to.type) ?? false;
  }
};
```

#### 3. PrTask Entity
```typescript
type PrTask = {
  id: PrTaskId;
  title: string;
  description: string;
  status: PrTaskStatus;
  dependencies: PrTaskId[];
  assignedTo?: AgentId;
  estimatedHours?: number;
  createdAt: Date;
  updatedAt: Date;
};

const PrTask = {
  create: (params: {
    title: string;
    description: string;
    dependencies?: PrTaskId[];
    estimatedHours?: number;
  }): Result<PrTask, ValidationError> => {
    if (!params.title || params.title.length < 5) {
      return err(new ValidationError('Task title must be at least 5 characters'));
    }
    
    const now = new Date();
    return ok({
      id: PrTaskId.generate(),
      title: params.title,
      description: params.description,
      status: PrTaskStatus.investigation(),
      dependencies: params.dependencies ?? [],
      estimatedHours: params.estimatedHours,
      createdAt: now,
      updatedAt: now
    });
  }
};
```

### Domain Operations

#### 1. Plan Creation
```typescript
type CreatePlanParams = {
  name: string;
  description?: string;
  lines: Array<{
    name: string;
    branch: string;
    tasks: Array<{
      title: string;
      description: string;
      dependencies?: string[]; // Task titles for dependency resolution
      estimatedHours?: number;
    }>;
  }>;
};

const createPlan = (params: CreatePlanParams): Result<Plan, PlanError> => {
  // Validate plan structure
  if (!params.name || params.name.length < 3) {
    return err(new PlanError('Plan name must be at least 3 characters'));
  }
  
  if (!params.lines || params.lines.length === 0) {
    return err(new PlanError('Plan must have at least one development line'));
  }
  
  // Create plan with dependency resolution
  const taskMap = new Map<string, PrTaskId>();
  const lines: Line[] = [];
  
  // First pass: create all tasks and build title->id mapping
  for (const lineParams of params.lines) {
    const tasks: PrTask[] = [];
    
    for (const taskParams of lineParams.tasks) {
      const taskResult = PrTask.create({
        title: taskParams.title,
        description: taskParams.description,
        estimatedHours: taskParams.estimatedHours
      });
      
      if (taskResult.isErr()) {
        return err(new PlanError(`Failed to create task: ${taskResult.error.message}`));
      }
      
      const task = taskResult.value;
      tasks.push(task);
      taskMap.set(taskParams.title, task.id);
    }
    
    lines.push({
      id: LineId.generate(),
      name: lineParams.name,
      branch: lineParams.branch,
      tasks,
      dependencies: []
    });
  }
  
  // Second pass: resolve dependencies
  let lineIndex = 0;
  for (const lineParams of params.lines) {
    let taskIndex = 0;
    for (const taskParams of lineParams.tasks) {
      if (taskParams.dependencies && taskParams.dependencies.length > 0) {
        const resolvedDeps: PrTaskId[] = [];
        
        for (const depTitle of taskParams.dependencies) {
          const depId = taskMap.get(depTitle);
          if (!depId) {
            return err(new PlanError(`Dependency not found: ${depTitle}`));
          }
          resolvedDeps.push(depId);
        }
        
        lines[lineIndex].tasks[taskIndex].dependencies = resolvedDeps;
      }
      taskIndex++;
    }
    lineIndex++;
  }
  
  // Validate no circular dependencies
  const validationResult = validateNoCycles(lines);
  if (validationResult.isErr()) {
    return err(validationResult.error);
  }
  
  const now = new Date();
  return ok({
    id: PlanId.generate(),
    name: params.name,
    description: params.description,
    lines,
    createdAt: now,
    updatedAt: now
  });
};
```

#### 2. Bulk Update Operation
```typescript
type BulkUpdateParams = {
  planId: PlanId;
  updates: Array<{
    taskId: PrTaskId;
    title?: string;
    description?: string;
    status?: PrTaskStatus;
    dependencies?: PrTaskId[];
    estimatedHours?: number;
  }>;
};

const bulkUpdateTasks = (
  plan: Plan,
  params: BulkUpdateParams
): Result<Plan, PlanError> => {
  const updatedPlan = { ...plan };
  const taskIndex = new Map<PrTaskId, { lineIndex: number; taskIndex: number }>();
  
  // Build task index
  plan.lines.forEach((line, li) => {
    line.tasks.forEach((task, ti) => {
      taskIndex.set(task.id, { lineIndex: li, taskIndex: ti });
    });
  });
  
  // Apply updates
  for (const update of params.updates) {
    const location = taskIndex.get(update.taskId);
    if (!location) {
      return err(new PlanError(`Task not found: ${update.taskId}`));
    }
    
    const { lineIndex, taskIndex: ti } = location;
    const currentTask = updatedPlan.lines[lineIndex].tasks[ti];
    
    // Validate status transition if status is being updated
    if (update.status && !PrTaskStatus.canTransition(currentTask.status, update.status)) {
      return err(new PlanError(
        `Invalid status transition from ${currentTask.status.type} to ${update.status.type}`
      ));
    }
    
    // Apply updates
    updatedPlan.lines[lineIndex].tasks[ti] = {
      ...currentTask,
      ...(update.title && { title: update.title }),
      ...(update.description && { description: update.description }),
      ...(update.status && { status: update.status }),
      ...(update.dependencies && { dependencies: update.dependencies }),
      ...(update.estimatedHours !== undefined && { estimatedHours: update.estimatedHours }),
      updatedAt: new Date()
    };
  }
  
  // Re-validate plan after updates
  const validationResult = validateNoCycles(updatedPlan.lines);
  if (validationResult.isErr()) {
    return err(validationResult.error);
  }
  
  updatedPlan.updatedAt = new Date();
  return ok(updatedPlan);
};
```

## MCP Tool API Design

### Input Schema

```typescript
const planToolInputSchema = z.object({
  action: z.enum(['create', 'update', 'replace', 'get']),
  
  // For create/replace actions
  plan: z.object({
    name: z.string().min(3),
    description: z.string().optional(),
    lines: z.array(z.object({
      name: z.string().min(3),
      branch: z.string().min(1),
      tasks: z.array(z.object({
        title: z.string().min(5),
        description: z.string(),
        dependencies: z.array(z.string()).optional(),
        estimatedHours: z.number().positive().optional()
      }))
    }))
  }).optional(),
  
  // For update actions
  planId: z.string().optional(),
  updates: z.array(z.object({
    taskId: z.string(),
    title: z.string().min(5).optional(),
    description: z.string().optional(),
    status: z.enum(['Investigation', 'InProgress', 'Review', 'Done', 'Blocked', 'Abandoned']).optional(),
    statusReason: z.string().optional(), // For Blocked/Abandoned
    dependencies: z.array(z.string()).optional(),
    estimatedHours: z.number().positive().optional()
  })).optional(),
  
  // For get actions
  filter: z.object({
    planId: z.string().optional(),
    status: z.array(z.string()).optional(),
    assignedTo: z.string().optional()
  }).optional()
});
```

### Response Format

```typescript
type PlanToolResponse = {
  success: boolean;
  planId?: string;
  plan?: {
    id: string;
    name: string;
    description?: string;
    lines: Array<{
      id: string;
      name: string;
      branch: string;
      tasks: Array<{
        id: string;
        title: string;
        description: string;
        status: string;
        dependencies: string[];
        assignedTo?: string;
        estimatedHours?: number;
      }>;
    }>;
    stats: {
      totalTasks: number;
      tasksByStatus: Record<string, number>;
      estimatedTotalHours?: number;
      parallelizableTaskGroups: number;
    };
  };
  error?: string;
};
```

### Usage Examples

#### 1. Creating a New Plan
```json
{
  "action": "create",
  "plan": {
    "name": "E-commerce Platform MVP",
    "description": "Initial release of e-commerce platform",
    "lines": [
      {
        "name": "User Authentication",
        "branch": "feature/auth",
        "tasks": [
          {
            "title": "Implement user registration API",
            "description": "Create REST endpoints for user registration with email verification",
            "estimatedHours": 8
          },
          {
            "title": "Implement login/logout API",
            "description": "Create session management and JWT token generation",
            "dependencies": ["Implement user registration API"],
            "estimatedHours": 6
          }
        ]
      },
      {
        "name": "Product Catalog",
        "branch": "feature/catalog",
        "tasks": [
          {
            "title": "Design product database schema",
            "description": "Create schema for products, categories, and variants",
            "estimatedHours": 4
          },
          {
            "title": "Implement product CRUD API",
            "description": "Create endpoints for product management",
            "dependencies": ["Design product database schema"],
            "estimatedHours": 12
          }
        ]
      }
    ]
  }
}
```

#### 2. Bulk Updating Tasks
```json
{
  "action": "update",
  "planId": "plan_1234567890_abc123def",
  "updates": [
    {
      "taskId": "task_1234567890_xyz789",
      "status": "InProgress"
    },
    {
      "taskId": "task_1234567890_def456",
      "status": "Blocked",
      "statusReason": "Waiting for design approval"
    },
    {
      "taskId": "task_1234567890_ghi789",
      "title": "Implement product search with Elasticsearch",
      "estimatedHours": 16
    }
  ]
}
```

## Parallelism Analysis

The plan tool includes built-in analysis to maximize parallel execution:

```typescript
const analyzeParallelism = (lines: Line[]): ParallelismAnalysis => {
  // Build dependency graph
  const graph = new Map<PrTaskId, Set<PrTaskId>>();
  const allTasks = new Map<PrTaskId, PrTask>();
  
  lines.forEach(line => {
    line.tasks.forEach(task => {
      allTasks.set(task.id, task);
      if (!graph.has(task.id)) {
        graph.set(task.id, new Set());
      }
      task.dependencies.forEach(dep => {
        graph.get(task.id)!.add(dep);
      });
    });
  });
  
  // Find tasks with no dependencies (can start immediately)
  const rootTasks = Array.from(allTasks.keys()).filter(
    taskId => graph.get(taskId)!.size === 0
  );
  
  // Calculate levels (parallel groups)
  const levels: PrTaskId[][] = [];
  const visited = new Set<PrTaskId>();
  let currentLevel = rootTasks;
  
  while (currentLevel.length > 0) {
    levels.push(currentLevel);
    currentLevel.forEach(task => visited.add(task));
    
    // Find next level (tasks whose dependencies are all visited)
    const nextLevel: PrTaskId[] = [];
    for (const [taskId, deps] of graph) {
      if (!visited.has(taskId) && Array.from(deps).every(dep => visited.has(dep))) {
        nextLevel.push(taskId);
      }
    }
    currentLevel = nextLevel;
  }
  
  return {
    parallelGroups: levels,
    maxParallelTasks: Math.max(...levels.map(l => l.length)),
    criticalPath: calculateCriticalPath(graph, allTasks)
  };
};
```

## Error Handling

All operations follow Result-based error handling:

```typescript
type PlanError =
  | { type: 'ValidationError'; message: string }
  | { type: 'NotFound'; planId: PlanId }
  | { type: 'CircularDependency'; cycle: PrTaskId[] }
  | { type: 'StorageError'; cause: Error }
  | { type: 'ConcurrentModification'; planId: PlanId };

const PlanError = {
  validation: (message: string): PlanError => ({ type: 'ValidationError', message }),
  notFound: (planId: PlanId): PlanError => ({ type: 'NotFound', planId }),
  circular: (cycle: PrTaskId[]): PlanError => ({ type: 'CircularDependency', cycle }),
  storage: (cause: Error): PlanError => ({ type: 'StorageError', cause }),
  concurrent: (planId: PlanId): PlanError => ({ type: 'ConcurrentModification', planId })
};
```

## Storage Design

Plans are persisted as JSON with versioning:

```typescript
type StoredPlan = {
  version: 1;
  plan: Plan;
  metadata: {
    lastModifiedBy?: AgentId;
    revisionNumber: number;
  };
};

const storage = {
  save: async (plan: Plan): Result<void, PlanError> => {
    const filePath = `./data/plans/${plan.id}.json`;
    const tempPath = `${filePath}.tmp`;
    
    try {
      // Write to temp file first
      await fs.writeFile(tempPath, JSON.stringify({ version: 1, plan }, null, 2));
      
      // Atomic rename
      await fs.rename(tempPath, filePath);
      
      return ok(undefined);
    } catch (error) {
      return err(PlanError.storage(error as Error));
    }
  }
};
```