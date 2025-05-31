import { Result} from 'neverthrow';
import { WorkPlan, workPlan } from '../../term/plan/work_plan.js';
import { WorkPlanId } from '../../term/plan/work_plan_id.js';
import { PlanEvent } from './events.js';
import { TaskList } from '../../term/task/task_list.js';
import { PrTaskId } from '../../term/task/pr_task_id.js';


/**
 * 語彙「計画コマンド」
 * domain type: command
 */

// --- type modeling section ---
// events
type PlanCreated = Extract<PlanEvent, { type: 'PlanCreated' }>;
type Plan =
  | CreatePlanRequested
  | UpdatePlanRequested
  | PlanCreated
  | PlanFailed

// commands
type CreatePlanCommand = (
    request: CreatePlanRequested
) => Result<PlanCreated, PlanFailed>;

type UpdateTasksCommand = (
    existingPlan: WorkPlan,
    request: UpdatePlanRequested,
) => Result<PlanEvent, PlanFailed>;

// --- data definitions ---
type CreatePlanRequested = {
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

type UpdatePlanRequested = {
  planId: WorkPlanId;
  taskUpdates: Parameters<typeof TaskList.updateTaskList>[1];
};

type PlanFailed =
  | { type: 'ValidationFailed'; reason: string }
  | { type: 'PlanNotFound'; planId: string }
  | { type: 'InvalidStateTransition'; reason: string };


// --- implementation section ---
// command APIs
const createPlanCommand: CreatePlanCommand = (
    request: CreatePlanRequested
) =>
  workPlan.create(request)
    .map(plan => PlanEvent.planCreated(plan.id, plan) as PlanCreated)
    .mapErr(errors => PlanCommandError.validationFailed(
      errors.map(e => `${e.type}: ${e.message}`).join('; ')
    ));

const updateTasksCommand: UpdateTasksCommand = (
    existingPlan,
    request
) =>
  TaskList.updateTaskList(existingPlan.tasks, request.taskUpdates)
    .map(updatedTasks => {
      const updatedPlan: WorkPlan = {
        ...existingPlan,
        tasks: updatedTasks,
        updatedAt: new Date()
      };
      return PlanEvent.planUpdated(updatedPlan.id, updatedPlan);
    })
    .mapErr(error =>
        PlanCommandError.validationFailed(error.message)
    );

// error handling
const PlanCommandError = {
  validationFailed: (reason: string): PlanFailed =>
      ({ type: 'ValidationFailed', reason }),

  toString: (error: PlanFailed): string => {
    switch (error.type) {
      case 'ValidationFailed':
        return `Validation failed: ${error.reason}`;
      case 'PlanNotFound':
        return `Plan not found: ${error.planId}`;
      case 'InvalidStateTransition':
        return `Invalid state transition: ${error.reason}`;
      default:
        throw new Error(`Unknown error type: ${error}`);
    }
  }
} as const;

// --- API section ---
/**
 * @command createPlan: Create a new work plan.
 * @command updateTasks: Update tasks in an existing work plan.
 * @utility toErrorMessage: Convert a PlanFailed error to a user-friendly string.
 */
export const PlanAggregate = {
  createPlan: createPlanCommand,
  updateTasks: updateTasksCommand,
  toErrorMessage: PlanCommandError.toString,
} as const;