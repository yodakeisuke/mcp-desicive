import { Result, ok, err } from 'neverthrow';
import { PrTask } from '../task/pr_task.js';
import { PrTaskId } from '../task/pr_task_id.js';
import { WorkPlanId, generateWorkPlanId } from './work_plan_id.js';

/**
 * 語彙「ワークプラン」
 * domain type: operation
 * persistent: false
 */

// --- type modeling section ---
// state
type WorkPlanState =
    | RequestedWorkPlan
    | WorkPlan
    | WorkPlanError[];

// eDSL
type ConstructWorkPlan = (
    params: RequestedWorkPlan
) => Result<WorkPlan, WorkPlanError[]>

// --- data definitions ---
export type RequestedWorkPlan = {
    name: string;
    description?: string;
    tasks: Array<{
        id: string;
        title: string;
        description: string;
        dependencies?: PrTaskId[];
        acceptanceCriteria: Array<{
            scenario: string;
            given: string[];
            when: string[];
            then: string[];
        }>;
        definitionOfReady: readonly string[];
    }>;
};

export type WorkPlan = {
    readonly id: WorkPlanId;
    readonly name: string;
    readonly description?: string;
    readonly tasks: readonly PrTask[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
};

export type WorkPlanError = {
    type: 'InvalidName' | 'NoTask' | 'DependencyNotFound' | 'TaskCreationFailed';
    message: string;
}

// --- implementation section ---
// workflow
const constructMasterWorkPlan: ConstructWorkPlan = (params) =>
  validateWorkPlanParams(params)
    .andThen(() => createTasksFromParams(params.tasks))
    .andThen(tasks => validateTaskDependencies(params.tasks, tasks)
      .map(() => tasks))
    .map(tasks => linkTaskDependencies(params.tasks, tasks))
    .map(tasks => createWorkPlan(params, tasks));

// sub tasks
const validateWorkPlanParams = (params: RequestedWorkPlan): Result<null, WorkPlanError[]> => {
  const errors = [
    ...workPlanRequiresProperName(params.name),
    ...workPlanMustContainTasks(params.tasks)
  ];
  return errors.length > 0 ? err(errors) : ok(null);
};

const createTasksFromParams = (taskParams: RequestedWorkPlan['tasks']): Result<PrTask[], WorkPlanError[]> => {
  const taskResults = taskParams.map((taskParam, index) => 
    PrTask.create(taskParam)
      .mapErr(taskErrors => ({ 
        type: 'TaskCreationFailed' as const, 
        message: `Task ${index + 1}: ${taskErrors.map(e => e.message).join(', ')}` 
      }))
  );
  
  return Result.combine(taskResults).mapErr(errors => [errors]);
};

const validateTaskDependencies = (
  taskParams: RequestedWorkPlan['tasks'],
  tasks: PrTask[]
): Result<null, WorkPlanError[]> => {
  const errors = findDependencyViolations(taskParams);
  return errors.length > 0 ? err(errors) : ok(null);
};

const linkTaskDependencies = (
  taskParams: RequestedWorkPlan['tasks'],
  tasks: PrTask[]
): PrTask[] => {
  const paramIdToTask = new Map(
    taskParams.map((param, index) => [param.id, tasks[index]])
  );
  
  return taskParams.map((param, index) => {
    const task = tasks[index];
    const depIds = param.dependencies || [];
    const resolvedDeps = depIds
      .map(depId => paramIdToTask.get(depId)!.id);
    
    return { ...task, dependencies: resolvedDeps };
  });
};

const createWorkPlan = (params: RequestedWorkPlan, tasks: PrTask[]): WorkPlan => {
  const now = new Date();
  return {
    id: generateWorkPlanId(),
    name: params.name,
    description: params.description,
    tasks,
    createdAt: now,
    updatedAt: now,
  };
};

// business rules
const workPlanRequiresProperName = (name: string): WorkPlanError[] => {
  if (!name || name.trim().length === 0) {
    return [{ type: 'InvalidName', message: 'WorkPlan name is required' }];
  }
  if (name.length < 3) {
    return [{ type: 'InvalidName', message: 'WorkPlan name must be at least 3 characters' }];
  }
  return [];
};

const workPlanMustContainTasks = (tasks: RequestedWorkPlan['tasks']): WorkPlanError[] =>
  !tasks || tasks.length < 1
    ? [{ type: 'NoTask', message: 'WorkPlan must have at least 1 item(s)' }]
    : [];

const findDependencyViolations = (taskParams: RequestedWorkPlan['tasks']): WorkPlanError[] => {
  const taskIdSet = new Set(taskParams.map(p => p.id));
  
  return taskParams.flatMap(param => {
    const depIds = param.dependencies || [];
    return depIds
      .filter(depId => !taskIdSet.has(depId))
      .map(depId => ({
        type: 'DependencyNotFound' as const,
        message: `Task "${param.id}": Dependency not found: ${depId}`
      }));
  });
};

// --- API section ---
export const workPlan = {
    create: constructMasterWorkPlan,
}
