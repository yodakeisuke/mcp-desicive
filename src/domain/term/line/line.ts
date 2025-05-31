import { WorkPlan } from '../plan/work_plan.js';
import { PrTask } from '../task/pr_task.js';
import { PrTaskId } from '../task/pr_task_id.js';

export type ParallelismAnalysis = {
  parallelGroups: PrTaskId[][];
  maxParallelTasks: number;
  criticalPath: PrTaskId[];
  estimatedCriticalPathHours?: number;
};

// =============================================================================
// Domain Logic Extraction Functions
// =============================================================================

/**
 * Build dependency graph with forward and reverse mappings
 */
const buildTaskGraph = (plan: WorkPlan): {
  allTasks: Map<PrTaskId, PrTask>;
  dependencyGraph: Map<PrTaskId, Set<PrTaskId>>;
  reverseDependencyGraph: Map<PrTaskId, Set<PrTaskId>>;
} => {
  const allTasks = new Map<PrTaskId, PrTask>();
  const dependencyGraph = new Map<PrTaskId, Set<PrTaskId>>();
  const reverseDependencyGraph = new Map<PrTaskId, Set<PrTaskId>>();

  // Collect all tasks and build dependency maps
  for (const task of plan.tasks) {
    allTasks.set(task.id, task);
    
    if (!dependencyGraph.has(task.id)) {
      dependencyGraph.set(task.id, new Set());
    }
    
    for (const depId of task.dependencies) {
      dependencyGraph.get(task.id)!.add(depId);
      
      if (!reverseDependencyGraph.has(depId)) {
        reverseDependencyGraph.set(depId, new Set());
      }
      reverseDependencyGraph.get(depId)!.add(task.id);
    }
  }

  return { allTasks, dependencyGraph, reverseDependencyGraph };
};

/**
 * Find all root tasks (tasks with no dependencies)
 */
const findRootTasks = (
  allTasks: Map<PrTaskId, PrTask>,
  dependencyGraph: Map<PrTaskId, Set<PrTaskId>>
): PrTaskId[] => {
  return Array.from(allTasks.keys()).filter(
    taskId => !dependencyGraph.get(taskId)?.size
  );
};

/**
 * Calculate topological levels for parallel execution
 */
const calculateTopologicalLevels = (
  rootTasks: PrTaskId[],
  dependencyGraph: Map<PrTaskId, Set<PrTaskId>>
): PrTaskId[][] => {
  const levels: PrTaskId[][] = [];
  const visited = new Set<PrTaskId>();
  let currentLevel = rootTasks;

  while (currentLevel.length > 0) {
    levels.push(currentLevel);
    currentLevel.forEach(task => visited.add(task));

    // Find next level - tasks whose dependencies are all visited
    const nextLevel: PrTaskId[] = [];
    for (const [taskId, deps] of dependencyGraph) {
      if (!visited.has(taskId) && Array.from(deps).every(dep => visited.has(dep))) {
        nextLevel.push(taskId);
      }
    }
    currentLevel = nextLevel;
  }

  return levels;
};

/**
 * Calculate the duration of a task path recursively
 */
const calculatePathDuration = (
  taskId: PrTaskId,
  allTasks: Map<PrTaskId, PrTask>,
  dependencyGraph: Map<PrTaskId, Set<PrTaskId>>,
  memo: Map<PrTaskId, { duration: number; path: PrTaskId[] }>
): { duration: number; path: PrTaskId[] } => {
  if (memo.has(taskId)) {
    return memo.get(taskId)!;
  }

  const task = allTasks.get(taskId);
  const taskDuration = task?.estimatedHours || 1; // Default to 1 hour if not estimated

  const dependencies = dependencyGraph.get(taskId) || new Set();
  if (dependencies.size === 0) {
    // Base case: no dependencies
    const result = { duration: taskDuration, path: [taskId] };
    memo.set(taskId, result);
    return result;
  }

  // Find longest path among dependencies
  let longestDepPath = { duration: 0, path: [] as PrTaskId[] };
  for (const depId of dependencies) {
    const depPath = calculatePathDuration(depId, allTasks, dependencyGraph, memo);
    if (depPath.duration > longestDepPath.duration) {
      longestDepPath = depPath;
    }
  }

  const result = {
    duration: taskDuration + longestDepPath.duration,
    path: [...longestDepPath.path, taskId]
  };
  memo.set(taskId, result);
  return result;
};

/**
 * Find the critical path (longest path through the dependency graph)
 */
const findCriticalPath = (
  allTasks: Map<PrTaskId, PrTask>,
  dependencyGraph: Map<PrTaskId, Set<PrTaskId>>
): PrTaskId[] => {
  const memo = new Map<PrTaskId, { duration: number; path: PrTaskId[] }>();
  let criticalPath: PrTaskId[] = [];
  let maxDuration = 0;

  for (const taskId of allTasks.keys()) {
    const { duration, path } = calculatePathDuration(taskId, allTasks, dependencyGraph, memo);
    if (duration > maxDuration) {
      maxDuration = duration;
      criticalPath = path;
    }
  }

  return criticalPath;
};

/**
 * Calculate total estimated hours for a set of tasks
 */
const calculateTotalHours = (
  taskIds: PrTaskId[],
  allTasks: Map<PrTaskId, PrTask>
): number | undefined => {
  const hours = taskIds.reduce((sum, taskId) => {
    const task = allTasks.get(taskId);
    return sum + (task?.estimatedHours || 0);
  }, 0);
  return hours > 0 ? hours : undefined;
};

// =============================================================================
// Main Analysis Functions
// =============================================================================

/**
 * Analyzes a plan to identify parallelism opportunities
 */
export const analyzeParallelism = (plan: WorkPlan): ParallelismAnalysis => {
  // Build dependency graph
  const { allTasks, dependencyGraph } = buildTaskGraph(plan);

  // Find root tasks and calculate levels
  const rootTasks = findRootTasks(allTasks, dependencyGraph);
  const levels = calculateTopologicalLevels(rootTasks, dependencyGraph);

  // Calculate critical path
  const criticalPath = findCriticalPath(allTasks, dependencyGraph);
  
  // Calculate estimated hours for critical path
  const estimatedCriticalPathHours = calculateTotalHours(criticalPath, allTasks);

  return {
    parallelGroups: levels,
    maxParallelTasks: Math.max(...levels.map(l => l.length)),
    criticalPath,
    estimatedCriticalPathHours
  };
};

/**
 * Count tasks blocked by a given task
 */
const countBlockedTasks = (
  blockingTaskId: PrTaskId,
  tasks: PrTask[]
): number => {
  return tasks.filter(task => 
    task.dependencies.includes(blockingTaskId)
  ).length;
};

/**
 * Find all blocking tasks on the critical path
 */
const findBlockingTasks = (
  tasks: PrTask[],
  criticalPath: PrTaskId[]
): Array<{ taskId: PrTaskId; blockedCount: number }> => {
  const criticalPathSet = new Set(criticalPath);
  const blockingTasks: Array<{ taskId: PrTaskId; blockedCount: number }> = [];
  
  for (const task of tasks) {
    if (task.status.type === 'Blocked' && criticalPathSet.has(task.id)) {
      const blockedCount = countBlockedTasks(task.id, tasks);
      blockingTasks.push({ taskId: task.id, blockedCount });
    }
  }

  return blockingTasks.sort((a, b) => b.blockedCount - a.blockedCount);
};

/**
 * Find branches with abandoned tasks
 */
const findAbandonedBranches = (plan: WorkPlan): string[] => {
  const branchesWithAbandoned = new Set<string>();
  
  for (const task of plan.tasks) {
    if (task.status.type === 'Abandoned') {
      branchesWithAbandoned.add(task.branch);
    }
  }
  
  return Array.from(branchesWithAbandoned);
};

/**
 * Identifies bottlenecks in the plan
 */
export const identifyBottlenecks = (plan: WorkPlan): {
  blockingTasks: Array<{ taskId: PrTaskId; blockedCount: number }>;
  abandonedBranches: string[];
} => {
  const analysis = analyzeParallelism(plan);
  
  return {
    blockingTasks: findBlockingTasks(Array.from(plan.tasks), analysis.criticalPath),
    abandonedBranches: findAbandonedBranches(plan)
  };
};