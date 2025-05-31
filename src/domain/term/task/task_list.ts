import { Result, ok, err } from 'neverthrow';
import { PrTask } from './pr_task.js';
import { PrTaskId } from './pr_task_id.js';
import { PrTaskStatus } from './status.js';

/**
 * 語彙「タスクリスト」
 * domain type: resource
 */

// --- modeling section ---
// state
type TaskList = readonly PrTask[];
type TaskListState =
  | UpdateRequestedTask[]
  | TaskList
  | TaskListError[];

// eDSL
type UpdateTaskList = (
  tasks: TaskList,
  updates: readonly UpdateRequestedTask[]
) => Result<TaskList, TaskListError>;

// --- data definitions ---
type UpdateRequestedTask = {
  taskId: PrTaskId;
  title?: string;
  description?: string;
  status?: PrTaskStatus;
  dependencies?: PrTaskId[];
  estimatedHours?: number;
};

// error path
type TaskListError = { type: 'TaskListError'; message: string };
const TaskListError = {
  create: (message: string): TaskListError => ({ type: 'TaskListError', message })
} as const;

// --- implementation section ---
// workflow
const updateTaskList: UpdateTaskList = (tasks, updates) => {
  if (!mustValidateAllTasksExist(tasks, updates)) {
    return err(TaskListError.create('Some tasks do not exist'));
  }

  const validationResults = updates.map(update =>
    validateTaskExists(tasks, update.taskId)
      .map(task => ({ task, update }))
  );

  return Result.combine(validationResults)
    .mapErr(error => TaskListError.create(error.message))
    .andThen(validUpdates => {
      const updateResults = validUpdates.map(({ task, update }) =>
        PrTask.applyUpdate(task, update)
          .mapErr(errors => TaskListError.create(errors.map(e => e.message).join(', ')))
      );

      return Result.combine(updateResults)
        .map(updatedTasks => {
          const updateMap = createUpdateMap(updates, updatedTasks);
          const result = mergeUpdates(tasks, updateMap);
          
          if (!mustPreserveTaskOrder(tasks, result)) {
            throw new Error('Task order was not preserved');
          }
          
          return result;
        });
    });
};

// sub tasks
const validateTaskExists = (tasks: TaskList, taskId: PrTaskId): Result<PrTask, TaskListError> => {
  const task = tasks.find(t => t.id === taskId);
  return task
    ? ok(task)
    : err(TaskListError.create(`Task not found: ${taskId}`));
};

const createUpdateMap = (updates: readonly UpdateRequestedTask[], updatedTasks: readonly PrTask[]): Map<PrTaskId, PrTask> => {
  const updateMap = new Map<PrTaskId, PrTask>();
  updates.forEach((update, index) => {
    updateMap.set(update.taskId, updatedTasks[index]);
  });
  return updateMap;
};

const mergeUpdates = (tasks: TaskList, updateMap: Map<PrTaskId, PrTask>): TaskList =>
  tasks.map(task => updateMap.get(task.id) ?? task);

// business rules
const mustValidateAllTasksExist = (tasks: TaskList, updates: readonly UpdateRequestedTask[]): boolean =>
  updates.every(update => tasks.some(task => task.id === update.taskId));

const mustPreserveTaskOrder = (original: TaskList, updated: TaskList): boolean =>
  original.length === updated.length && 
  original.every((task, index) => updated[index].id === task.id);

// --- API section ---
export const TaskList = {
  updateTaskList
} as const;