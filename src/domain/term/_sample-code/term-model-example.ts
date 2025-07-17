import { Result, ok, err } from 'neverthrow';

/**
 * Sample Term Model Implementation
 * 
 * This demonstrates the Term Model pattern for Domain-Driven Design:
 * - Domain vocabulary as executable code
 * - Smart constructors with validation
 * - Immutable value objects and operations
 * - Business rule enforcement
 * - Type-safe domain modeling
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Domain Type Classification
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Term types in this domain:
 * - operation: Business procedures and workflows
 * - resource: Business resources and entities  
 * - policy: Business policies and rules
 * - value: Value objects and identifiers
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Value Types - Branded Types for Type Safety
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 語彙「WorkPlanId」
 * domain type: value
 */
type WorkPlanId = string & { readonly _brand: 'WorkPlanId' };

const WorkPlanId = {
  generate: (): WorkPlanId => {
    return `WorkPlan_${Date.now()}_${Math.random().toString(36).substring(2, 11)}` as WorkPlanId;
  },
  
  fromString: (value: string): Result<WorkPlanId, ValidationError> => {
    if (!value || value.trim().length === 0) {
      return err({ type: 'InvalidFormat', message: 'WorkPlanId cannot be empty' });
    }
    if (!value.startsWith('WorkPlan_')) {
      return err({ type: 'InvalidFormat', message: 'WorkPlanId must start with "WorkPlan_"' });
    }
    return ok(value as WorkPlanId);
  },
  
  toString: (id: WorkPlanId): string => id
} as const;

/**
 * 語彙「TaskId」
 * domain type: value
 */
type TaskId = string & { readonly _brand: 'TaskId' };

const TaskId = {
  generate: (): TaskId => {
    return `Task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}` as TaskId;
  },
  
  fromString: (value: string): Result<TaskId, ValidationError> => {
    if (!value || value.trim().length === 0) {
      return err({ type: 'InvalidFormat', message: 'TaskId cannot be empty' });
    }
    return ok(value as TaskId);
  },
  
  toString: (id: TaskId): string => id
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Operation Types - Business Procedures
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 語彙「TaskStatus」
 * domain type: value
 */
type TaskStatus = 
  | { type: 'ToBeRefined' }
  | { type: 'Refined' }
  | { type: 'Implemented' }
  | { type: 'Reviewed' }
  | { type: 'Merged' }
  | { type: 'Blocked'; reason: string }
  | { type: 'Abandoned'; reason: string };

const TaskStatus = {
  toBeRefined: (): TaskStatus => ({ type: 'ToBeRefined' }),
  refined: (): TaskStatus => ({ type: 'Refined' }),
  implemented: (): TaskStatus => ({ type: 'Implemented' }),
  reviewed: (): TaskStatus => ({ type: 'Reviewed' }),
  merged: (): TaskStatus => ({ type: 'Merged' }),
  blocked: (reason: string): TaskStatus => ({ type: 'Blocked', reason }),
  abandoned: (reason: string): TaskStatus => ({ type: 'Abandoned', reason }),
  
  canTransition: (current: TaskStatus, next: TaskStatus): boolean => {
    const transitions: Record<string, string[]> = {
      'ToBeRefined': ['Refined', 'Blocked', 'Abandoned'],
      'Refined': ['Implemented', 'Blocked', 'Abandoned'],
      'Implemented': ['Reviewed', 'Blocked', 'Abandoned'],
      'Reviewed': ['Merged', 'Implemented', 'Blocked', 'Abandoned'],
      'Merged': [],
      'Blocked': ['ToBeRefined', 'Refined', 'Implemented', 'Reviewed', 'Abandoned'],
      'Abandoned': []
    };
    
    return transitions[current.type]?.includes(next.type) ?? false;
  },
  
  toString: (status: TaskStatus): string => {
    switch (status.type) {
      case 'ToBeRefined': return 'To Be Refined';
      case 'Refined': return 'Refined';
      case 'Implemented': return 'Implemented';
      case 'Reviewed': return 'Reviewed';
      case 'Merged': return 'Merged';
      case 'Blocked': return `Blocked: ${status.reason}`;
      case 'Abandoned': return `Abandoned: ${status.reason}`;
      default:
        const _exhaustive: never = status;
        throw new Error(`Unknown status type: ${_exhaustive}`);
    }
  }
} as const;

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

type RequestedAcceptanceCriterion = {
  readonly scenario: string;
  readonly given: readonly string[];
  readonly when: readonly string[];
  readonly then: readonly string[];
};

const AcceptanceCriterion = {
  create: (params: RequestedAcceptanceCriterion): Result<AcceptanceCriterion, ValidationError[]> => {
    const errors: ValidationError[] = [];
    
    if (!params.scenario || params.scenario.trim().length === 0) {
      errors.push({ type: 'InvalidFormat', message: 'Scenario is required' });
    }
    
    if (!params.given || params.given.length === 0) {
      errors.push({ type: 'InvalidFormat', message: 'Given conditions are required' });
    }
    
    if (!params.when || params.when.length === 0) {
      errors.push({ type: 'InvalidFormat', message: 'When conditions are required' });
    }
    
    if (!params.then || params.then.length === 0) {
      errors.push({ type: 'InvalidFormat', message: 'Then conditions are required' });
    }
    
    if (errors.length > 0) {
      return err(errors);
    }
    
    return ok({
      scenario: params.scenario.trim(),
      given: params.given,
      when: params.when,
      then: params.then
    });
  }
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Resource Types - Business Entities
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 語彙「Task」
 * domain type: operation
 */
type Task = {
  readonly id: TaskId;
  readonly title: string;
  readonly description: string;
  readonly branch: string;
  readonly worktree: string;
  readonly status: TaskStatus;
  readonly dependencies: TaskId[];
  readonly acceptanceCriteria: readonly AcceptanceCriterion[];
  readonly definitionOfReady: readonly string[];
  readonly assignedWorktree?: string;
};

type RequestedTask = {
  id: string;
  title: string;
  description: string;
  dependencies?: TaskId[];
  acceptanceCriteria: RequestedAcceptanceCriterion[];
  definitionOfReady: readonly string[];
};

type TaskError = {
  type: 'InvalidTitle' | 'InvalidDescription' | 'InvalidId' | 'InvalidStatusTransition' | 'TaskCreationFailed' | 'AcceptanceCriteriaCreationFailed' | 'DefinitionOfReadyValidationFailed' | 'InvalidWorktreeName';
  message: string;
};

type ValidationError = {
  type: 'InvalidFormat' | 'RequiredField' | 'BusinessRule';
  message: string;
};

// eDSL (embedded Domain Specific Language)
type ConstructTask = (params: RequestedTask) => Result<Task, TaskError[]>;
type UpdateTaskStatus = (task: Task, newStatus: TaskStatus) => Result<Task, TaskError[]>;
type AssignWorktree = (task: Task, worktreeName: string) => Result<Task, TaskError[]>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Implementation Section - Business Logic
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Main workflow - demonstrates function composition
const constructTask: ConstructTask = (params) =>
  validateTaskParams(params)
    .andThen(validParams => 
      createAcceptanceCriteriaFromParams(validParams.acceptanceCriteria)
        .andThen(criteria =>
          validateDefinitionOfReady(validParams.definitionOfReady)
            .andThen(validatedDoR =>
              ok(createTask({
                ...validParams,
                acceptanceCriteria: criteria as AcceptanceCriterion[],
                definitionOfReady: validatedDoR
              }))
            )
        )
    );

const updateTaskStatus: UpdateTaskStatus = (task, newStatus) =>
  TaskStatus.canTransition(task.status, newStatus)
    ? ok({ ...task, status: newStatus })
    : err([TaskError.create('InvalidStatusTransition', 
        `Cannot transition from ${TaskStatus.toString(task.status)} to ${TaskStatus.toString(newStatus)}`
      )]);

const assignWorktree: AssignWorktree = (task, worktreeName) => {
  const errors = validateWorktreeName(worktreeName);
  return errors.length > 0
    ? err(errors)
    : ok({ ...task, assignedWorktree: worktreeName });
};

// Helper functions
const validateTaskParams = (params: RequestedTask): Result<RequestedTask, TaskError[]> => {
  const errors = [
    ...validateTitle(params.title),
    ...validateDescription(params.description),
    ...validateAcceptanceCriteria(params.acceptanceCriteria)
  ];
  return errors.length > 0 ? err(errors) : ok(params);
};

const createTask = (params: RequestedTask & { acceptanceCriteria: AcceptanceCriterion[]; definitionOfReady: readonly string[] }): Task => {
  return {
    id: TaskId.generate(),
    title: params.title,
    description: params.description,
    branch: `feature/${params.id}`,
    worktree: '',
    status: TaskStatus.toBeRefined(),
    dependencies: params.dependencies ?? [],
    acceptanceCriteria: params.acceptanceCriteria,
    definitionOfReady: params.definitionOfReady
  };
};

const createAcceptanceCriteriaFromParams = (
  criteriaParams: readonly RequestedAcceptanceCriterion[]
): Result<readonly AcceptanceCriterion[], TaskError[]> => {
  const results: AcceptanceCriterion[] = [];
  const errors: TaskError[] = [];
  
  for (const param of criteriaParams) {
    const result = AcceptanceCriterion.create(param);
    if (result.isOk()) {
      results.push(result.value);
    } else {
      const criterionErrors = result.error;
      for (const criterionError of criterionErrors) {
        errors.push(TaskError.create(
          'AcceptanceCriteriaCreationFailed',
          `Failed to create acceptance criterion: ${criterionError.message}`
        ));
      }
    }
  }
  
  return errors.length > 0 ? err(errors) : ok(results);
};

const validateDefinitionOfReady = (definitionOfReady: readonly string[]): Result<readonly string[], TaskError[]> => {
  const errors: TaskError[] = [];
  
  if (definitionOfReady.length === 0) {
    errors.push(TaskError.create('DefinitionOfReadyValidationFailed', 'Definition of ready cannot be empty'));
  }
  
  for (const item of definitionOfReady) {
    if (!item || item.trim().length === 0) {
      errors.push(TaskError.create('DefinitionOfReadyValidationFailed', 'Definition of ready items cannot be empty'));
    }
  }
  
  return errors.length > 0 ? err(errors) : ok(definitionOfReady);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Business Rules - Domain Policies
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const validateTitle = (title: string): TaskError[] => {
  if (!title || title.trim().length === 0) {
    return [TaskError.create('InvalidTitle', 'Task title is required')];
  }
  if (title.length < 5) {
    return [TaskError.create('InvalidTitle', 'Task title must be at least 5 characters')];
  }
  return [];
};

const validateDescription = (description: string): TaskError[] => {
  if (!description || description.trim().length === 0) {
    return [TaskError.create('InvalidDescription', 'Task description is required')];
  }
  return [];
};

const validateAcceptanceCriteria = (criteria: readonly RequestedAcceptanceCriterion[]): TaskError[] => {
  if (criteria.length === 0) {
    return [TaskError.create('AcceptanceCriteriaCreationFailed', 'At least one acceptance criterion is required')];
  }
  return [];
};

const validateWorktreeName = (worktreeName: string): TaskError[] => {
  if (!worktreeName || worktreeName.trim().length === 0) {
    return [TaskError.create('InvalidWorktreeName', 'Worktree name is required and cannot be empty')];
  }
  return [];
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WorkPlan Operation - Complex Business Procedure
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 語彙「WorkPlan」
 * domain type: operation
 */
type WorkPlan = {
  readonly id: WorkPlanId;
  readonly name: string;
  readonly featureBranch: string;
  readonly originWorktreePath: string;
  readonly evolvingPRDPath: string;
  readonly evolvingDesignDocPath: string;
  readonly description?: string;
  readonly tasks: readonly Task[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

type RequestedWorkPlan = {
  name: string;
  featureBranch: string;
  originWorktreePath: string;
  evolvingPRDPath: string;
  evolvingDesignDocPath: string;
  description?: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    dependencies?: TaskId[];
    acceptanceCriteria: RequestedAcceptanceCriterion[];
    definitionOfReady: readonly string[];
  }>;
};

type WorkPlanError = {
  type: 'InvalidName' | 'NoTask' | 'DependencyNotFound' | 'TaskCreationFailed';
  message: string;
};

// eDSL
type ConstructWorkPlan = (params: RequestedWorkPlan) => Result<WorkPlan, WorkPlanError[]>;

// Complex workflow with multiple validation steps
const constructWorkPlan: ConstructWorkPlan = (params) =>
  validateWorkPlanParams(params)
    .andThen(() => createTasksFromParams(params.tasks))
    .andThen(tasks => validateTaskDependencies(params.tasks, tasks)
      .map(() => tasks))
    .map(tasks => linkTaskDependencies(params.tasks, tasks))
    .map(tasks => createWorkPlan(params, tasks));

// Sub-workflows
const validateWorkPlanParams = (params: RequestedWorkPlan): Result<null, WorkPlanError[]> => {
  const errors = [
    ...validateWorkPlanName(params.name),
    ...validateWorkPlanTasks(params.tasks)
  ];
  return errors.length > 0 ? err(errors) : ok(null);
};

const createTasksFromParams = (taskParams: RequestedWorkPlan['tasks']): Result<Task[], WorkPlanError[]> => {
  const taskResults = taskParams.map((taskParam, index) => 
    constructTask(taskParam)
      .mapErr(taskErrors => ({ 
        type: 'TaskCreationFailed' as const, 
        message: `Task ${index + 1}: ${taskErrors.map(e => e.message).join(', ')}` 
      }))
  );
  
  return Result.combine(taskResults).mapErr(errors => [errors]);
};

const validateTaskDependencies = (
  taskParams: RequestedWorkPlan['tasks'],
  tasks: Task[]
): Result<null, WorkPlanError[]> => {
  const errors = findDependencyViolations(taskParams);
  return errors.length > 0 ? err(errors) : ok(null);
};

const linkTaskDependencies = (
  taskParams: RequestedWorkPlan['tasks'],
  tasks: Task[]
): Task[] => {
  const paramIdToTask = new Map(
    taskParams.map((param, index) => [param.id, tasks[index]])
  );
  
  return taskParams.map((param, index) => {
    const task = tasks[index];
    const depIds = param.dependencies || [];
    const resolvedDeps = depIds
      .map(depId => paramIdToTask.get(TaskId.toString(depId))!.id);
    
    return { ...task, dependencies: resolvedDeps };
  });
};

const createWorkPlan = (params: RequestedWorkPlan, tasks: Task[]): WorkPlan => {
  const now = new Date();
  return {
    id: WorkPlanId.generate(),
    name: params.name,
    featureBranch: params.featureBranch,
    originWorktreePath: params.originWorktreePath,
    evolvingPRDPath: params.evolvingPRDPath,
    evolvingDesignDocPath: params.evolvingDesignDocPath,
    description: params.description,
    tasks,
    createdAt: now,
    updatedAt: now,
  };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Business Rules for WorkPlan
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const validateWorkPlanName = (name: string): WorkPlanError[] => {
  if (!name || name.trim().length === 0) {
    return [{ type: 'InvalidName', message: 'WorkPlan name is required' }];
  }
  if (name.length < 3) {
    return [{ type: 'InvalidName', message: 'WorkPlan name must be at least 3 characters' }];
  }
  return [];
};

const validateWorkPlanTasks = (tasks: RequestedWorkPlan['tasks']): WorkPlanError[] =>
  !tasks || tasks.length < 1
    ? [{ type: 'NoTask', message: 'WorkPlan must have at least 1 task' }]
    : [];

const findDependencyViolations = (taskParams: RequestedWorkPlan['tasks']): WorkPlanError[] => {
  const taskIdSet = new Set(taskParams.map(p => p.id));
  
  return taskParams.flatMap(param => {
    const depIds = param.dependencies || [];
    return depIds
      .filter(depId => !taskIdSet.has(TaskId.toString(depId)))
      .map(depId => ({
        type: 'DependencyNotFound' as const,
        message: `Task "${param.id}": Dependency not found: ${TaskId.toString(depId)}`
      }));
  });
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Handling Utilities
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TaskError = {
  create: (type: TaskError['type'], message: string): TaskError => ({ type, message })
} as const;

const WorkPlanError = {
  create: (type: WorkPlanError['type'], message: string): WorkPlanError => ({ type, message })
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Public API - Term Model Interface
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Task Term Model
 */
export const TaskModel = {
  create: constructTask,
  updateStatus: updateTaskStatus,
  assignWorktree: assignWorktree
} as const;

/**
 * WorkPlan Term Model
 */
export const WorkPlanModel = {
  create: constructWorkPlan
} as const;

/**
 * Value Object Constructors
 */
export const Values = {
  WorkPlanId,
  TaskId,
  TaskStatus,
  AcceptanceCriterion
} as const;

/**
 * Type Exports for External Use
 */
export type {
  WorkPlan,
  RequestedWorkPlan,
  Task,
  RequestedTask,
  TaskStatus,
  AcceptanceCriterion,
  WorkPlanId,
  TaskId,
  WorkPlanError,
  TaskError,
  ValidationError
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Usage Examples
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/*
// Creating a task with validation
const taskResult = TaskModel.create({
  id: 'task-001',
  title: 'Implement user authentication',
  description: 'Add OAuth2 authentication to the system',
  acceptanceCriteria: [
    {
      scenario: 'User can log in with Google',
      given: ['User has a Google account'],
      when: ['User clicks "Sign in with Google"'],
      then: ['User is authenticated and redirected to dashboard']
    }
  ],
  definitionOfReady: [
    'Requirements are clearly defined',
    'Acceptance criteria are written',
    'Dependencies are identified'
  ]
});

// Handle the result
taskResult
  .map(task => {
    console.log('Task created:', task.id);
    // Use the task...
  })
  .mapErr(errors => {
    console.error('Task creation failed:', errors.map(e => e.message));
  });

// Creating a work plan
const workPlanResult = WorkPlanModel.create({
  name: 'User Authentication Feature',
  featureBranch: 'feature/user-auth',
  originWorktreePath: '/project/main',
  evolvingPRDPath: '/docs/prd/user-auth.md',
  evolvingDesignDocPath: '/docs/design/user-auth.md',
  description: 'Implement comprehensive user authentication system',
  tasks: [
    {
      id: 'task-001',
      title: 'Implement OAuth2 flow',
      description: 'Add OAuth2 authentication',
      acceptanceCriteria: [
        {
          scenario: 'OAuth2 login',
          given: ['User visits login page'],
          when: ['User clicks OAuth2 provider'],
          then: ['User is authenticated']
        }
      ],
      definitionOfReady: ['OAuth2 provider configured']
    }
  ]
});

// Status transitions
if (taskResult.isOk()) {
  const task = taskResult.value;
  
  // Transition to refined status
  const refinedResult = TaskModel.updateStatus(task, Values.TaskStatus.refined());
  
  refinedResult
    .map(updatedTask => {
      console.log('Task refined:', updatedTask.id);
    })
    .mapErr(errors => {
      console.error('Status transition failed:', errors.map(e => e.message));
    });
}
*/