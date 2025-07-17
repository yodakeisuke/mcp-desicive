import { Result, ok, err } from 'neverthrow';

/**
 * Sample Read Model Implementation
 * 
 * This demonstrates the Read Model pattern for CQRS architecture:
 * - Event projections to build read-optimized views
 * - Query functions for retrieving specific view slices
 * - Statistics and analytics computation
 * - Optimized for read performance, not write consistency
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Domain Events (from Command side)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type DomainEvent = 
  | { type: 'PlanCreated'; planId: string; plan: Plan }
  | { type: 'PlanUpdated'; planId: string; plan: Plan }
  | { type: 'TaskStatusChanged'; taskId: string; planId: string; newStatus: TaskStatus }
  | { type: 'TasksAdded'; planId: string; taskIds: string[] }
  | { type: 'DependenciesChanged'; taskId: string; planId: string; newDeps: string[] };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Core Domain Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Plan = {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
};

type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  branch: string;
  dependencies: string[];
  assignedWorktree?: string;
  createdAt: Date;
  updatedAt: Date;
};

type TaskStatus = 
  | { type: 'ToBeRefined' }
  | { type: 'Refined' }
  | { type: 'Implemented' }
  | { type: 'Reviewed' }
  | { type: 'Merged' }
  | { type: 'Blocked'; reason: string }
  | { type: 'Abandoned'; reason: string };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Read Model Types - Optimized for Queries
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type LineId = string & { readonly _brand: 'LineId' };

type LineState = 
  | { type: 'NotStarted' }
  | { type: 'InProgress' }
  | { type: 'Completed' }
  | { type: 'Blocked' }
  | { type: 'Abandoned' };

type LineExecutability = {
  isExecutable: boolean;
  isAssigned: boolean;
  isCompleted: boolean;
  blockedBy: LineId[];
};

type LineView = {
  readonly id: LineId;
  readonly name: string;
  readonly branch: string;
  readonly tasks: readonly Task[];
  readonly dependencies: readonly LineId[];
  readonly state: LineState;
  readonly executability: LineExecutability;
};

type CorePlanStats = {
  readonly totalTasks: number;
  readonly totalLines: number;
  readonly tasksByStatus: Readonly<Record<string, number>>;
  readonly tasksByBranch: Readonly<Record<string, number>>;
  readonly estimatedTotalHours?: number;
};

type ParallelExecutionStats = {
  readonly executableLines: number;
  readonly unassignedLines: number;
  readonly executableUnassignedLines: number;
  readonly blockedLines: number;
  readonly completedLines: number;
};

type ViewConstructionConfig = {
  readonly includeCompletedLines?: boolean;
  readonly includeDetailedStats?: boolean;
  readonly includeRecommendations?: boolean;
  readonly maxAge?: number;
  readonly cacheKey?: string;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Read Model Views
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type BasePlanView = {
  readonly plan: Plan;
  readonly lines: readonly LineView[];
  readonly stats: CorePlanStats;
  readonly lastUpdated: Date;
};

type TrackingPlanView = {
  readonly plan: Plan;
  readonly lines: readonly LineView[];
  readonly stats: CorePlanStats & {
    readonly parallelExecutionStats: ParallelExecutionStats;
  };
  readonly lastUpdated: Date;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Event Projections - Building State from Events
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Projects a Plan from a stream of events
 * This is the core of event sourcing - rebuilding state from events
 */
const projectPlanFromEvents = (events: DomainEvent[]): Plan | null => {
  let currentPlan: Plan | null = null;
  
  for (const event of events) {
    switch (event.type) {
      case 'PlanCreated':
        currentPlan = event.plan;
        break;
      case 'PlanUpdated':
        currentPlan = event.plan;
        break;
      case 'TaskStatusChanged':
        if (currentPlan) {
          currentPlan = updateTaskStatusInPlan(currentPlan, event.taskId, event.newStatus);
        }
        break;
      case 'TasksAdded':
        if (currentPlan) {
          currentPlan = addTasksToPlan(currentPlan, event.taskIds);
        }
        break;
      case 'DependenciesChanged':
        if (currentPlan) {
          currentPlan = updateTaskDependenciesInPlan(currentPlan, event.taskId, event.newDeps);
        }
        break;
      default:
        // Exhaustive check - TypeScript will error if we miss a case
        const _exhaustive: never = event;
        throw new Error(`Unhandled event type: ${_exhaustive}`);
    }
  }
  
  return currentPlan;
};

/**
 * Derives LineViews from a Plan
 * Lines represent parallel execution branches (feature branches)
 */
const deriveLineViewsFromPlan = (plan: Plan): LineView[] => {
  const tasksByBranch = groupTasksByBranch(plan.tasks);
  const lines = createLinesFromTaskGroups(tasksByBranch);
  const linesWithDependencies = calculateLineDependencies(lines, plan.tasks);
  
  return linesWithDependencies.map(line => enrichLineWithAnalysis(line));
};

/**
 * Calculates execution constraints for a line
 * Determines if a line can be executed in parallel
 */
const calculateLineExecutability = (
  line: LineView, 
  allLines: readonly LineView[]
): LineExecutability => {
  const completedDependencies = line.dependencies.filter(depId =>
    allLines.find(l => l.id === depId)?.state.type === 'Completed'
  );
  
  const isExecutable = completedDependencies.length === line.dependencies.length &&
                      line.state.type !== 'Completed' &&
                      line.state.type !== 'Abandoned';
  
  const isAssigned = line.tasks.some(task => task.assignedWorktree);
  const isCompleted = line.state.type === 'Completed';
  
  const blockedBy = line.dependencies.filter(depId =>
    allLines.find(l => l.id === depId)?.state.type !== 'Completed'
  );
  
  return {
    isExecutable,
    isAssigned,
    isCompleted,
    blockedBy
  };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Statistics Projections
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const calculateCorePlanStats = (plan: Plan, lines: readonly LineView[]): CorePlanStats => {
  const tasksByStatus: Record<string, number> = {
    'ToBeRefined': 0,
    'Refined': 0,
    'Implemented': 0,
    'Reviewed': 0,
    'Merged': 0,
    'Blocked': 0,
    'Abandoned': 0
  };
  
  const tasksByBranch: Record<string, number> = {};

  for (const task of plan.tasks) {
    tasksByStatus[task.status.type] = (tasksByStatus[task.status.type] || 0) + 1;
    tasksByBranch[task.branch] = (tasksByBranch[task.branch] || 0) + 1;
  }

  return {
    totalTasks: plan.tasks.length,
    totalLines: lines.length,
    tasksByStatus,
    tasksByBranch
  };
};

const calculateParallelExecutionStats = (lines: readonly LineView[]): ParallelExecutionStats => {
  const completedLines = getCompletedLineIds(lines);
  
  const executableLines = lines.filter(line => 
    isLineExecutable(line, completedLines)
  );
  
  const unassignedLines = lines.filter(line => 
    isLineUnassigned(line)
  );
  
  const executableUnassignedLines = executableLines.filter(line => 
    isLineUnassigned(line)
  );
  
  const blockedLines = lines.filter(line => 
    line.state.type === 'Blocked' || 
    (line.dependencies.length > 0 && !isLineExecutable(line, completedLines))
  );

  return {
    executableLines: executableLines.length,
    unassignedLines: unassignedLines.length,
    executableUnassignedLines: executableUnassignedLines.length,
    blockedLines: blockedLines.length,
    completedLines: completedLines.size
  };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Query Functions - The Read Model Interface
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Creates a basic plan view from a plan entity
 * Optimized for general plan viewing
 */
const createPlanViewFromPlan = (
  plan: Plan, 
  config: ViewConstructionConfig = {}
): BasePlanView => {
  const lines = deriveEnrichedLines(plan);
  const filteredLines = applyLineFilters(lines, config);
  const stats = calculateCorePlanStats(plan, filteredLines);
  
  return {
    plan,
    lines: filteredLines,
    stats,
    lastUpdated: new Date()
  };
};

/**
 * Creates a plan view from event stream
 * Demonstrates event sourcing for read models
 */
const createPlanViewFromEvents = (
  events: DomainEvent[], 
  config: ViewConstructionConfig = {}
): BasePlanView | null => {
  const plan = projectPlanFromEvents(events);
  if (!plan) {
    return null;
  }
  
  return createPlanViewFromPlan(plan, config);
};

/**
 * Creates a tracking view with parallel execution analysis
 * Optimized for project management and resource allocation
 */
const createTrackViewFromPlan = (
  plan: Plan, 
  config: ViewConstructionConfig = {}
): TrackingPlanView => {
  const lines = deriveEnrichedLines(plan);
  const filteredLines = applyTrackingFilters(lines, config);
  
  const coreStats = calculateCorePlanStats(plan, filteredLines);
  const parallelExecutionStats = calculateParallelExecutionStats(filteredLines);
  
  return {
    plan,
    lines: filteredLines,
    stats: {
      ...coreStats,
      parallelExecutionStats
    },
    lastUpdated: new Date()
  };
};

/**
 * Creates a tracking view from event stream
 * Combines event sourcing with specialized tracking projections
 */
const createTrackViewFromEvents = (
  events: DomainEvent[], 
  config: ViewConstructionConfig = {}
): TrackingPlanView | null => {
  const plan = projectPlanFromEvents(events);
  if (!plan) {
    return null;
  }
  
  return createTrackViewFromPlan(plan, config);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Public API - Expose Read Model Operations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Plan View Queries - General purpose plan viewing
 */
export const planViewQueries = {
  fromPlan: createPlanViewFromPlan,
  fromEvents: createPlanViewFromEvents
} as const;

/**
 * Track View Queries - Project tracking and parallel execution analysis
 */
export const trackViewQueries = {
  fromPlan: createTrackViewFromPlan,
  fromEvents: createTrackViewFromEvents
} as const;

/**
 * Projection Utilities - For building custom read models
 */
export const projectionUtils = {
  projectPlanFromEvents,
  deriveLineViewsFromPlan,
  calculateLineExecutability,
  calculateCorePlanStats,
  calculateParallelExecutionStats
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const deriveEnrichedLines = (plan: Plan) => {
  const basicLines = deriveLineViewsFromPlan(plan);
  
  return basicLines.map(line => ({
    ...line,
    executability: calculateLineExecutability(line, basicLines)
  }));
};

const applyLineFilters = (lines: LineView[], config: ViewConstructionConfig) => {
  let filteredLines = lines;
  
  if (!config.includeCompletedLines) {
    filteredLines = filteredLines.filter(line => line.state.type !== 'Completed');
  }
  
  return filteredLines;
};

const applyTrackingFilters = (lines: LineView[], config: ViewConstructionConfig) => {
  let filteredLines = lines;
  
  if (config.includeCompletedLines === false) {
    filteredLines = filteredLines.filter(line => line.state.type !== 'Completed');
  }
  
  return filteredLines;
};

const isLineCompleted = (line: LineView): boolean => {
  if (line.tasks.length === 0) return false;
  return line.tasks.every(task => ['Merged'].includes(task.status.type));
};

const isLineExecutable = (line: LineView, completedLines: Set<LineId>): boolean => {
  if (completedLines.has(line.id)) return false;
  return line.dependencies.every(depId => completedLines.has(depId));
};

const isLineUnassigned = (line: LineView): boolean => {
  if (line.tasks.length === 0) return true;
  return line.tasks.every(task => !task.assignedWorktree);
};

const getCompletedLineIds = (lines: readonly LineView[]): Set<LineId> => {
  return new Set(
    lines
      .filter(line => isLineCompleted(line))
      .map(line => line.id)
  );
};

// Event projection helpers
const updateTaskStatusInPlan = (plan: Plan, taskId: string, newStatus: TaskStatus): Plan => {
  const updatedTasks = plan.tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, status: newStatus, updatedAt: new Date() };
    }
    return task;
  });

  return {
    ...plan,
    tasks: updatedTasks,
    updatedAt: new Date()
  };
};

const addTasksToPlan = (plan: Plan, taskIds: string[]): Plan => {
  // Implementation would add tasks to plan
  return {
    ...plan,
    updatedAt: new Date()
  };
};

const updateTaskDependenciesInPlan = (plan: Plan, taskId: string, newDeps: string[]): Plan => {
  const updatedTasks = plan.tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, dependencies: newDeps, updatedAt: new Date() };
    }
    return task;
  });

  return {
    ...plan,
    tasks: updatedTasks,
    updatedAt: new Date()
  };
};

const groupTasksByBranch = (tasks: readonly Task[]): Map<string, Task[]> => {
  const tasksByBranch = new Map<string, Task[]>();
  
  for (const task of tasks) {
    const branchTasks = tasksByBranch.get(task.branch) || [];
    branchTasks.push(task);
    tasksByBranch.set(task.branch, branchTasks);
  }
  
  return tasksByBranch;
};

const createLinesFromTaskGroups = (tasksByBranch: Map<string, Task[]>): LineView[] => {
  const lines: LineView[] = [];
  
  tasksByBranch.forEach((tasks, branch) => {
    const lineId = generateLineId();
    
    lines.push({
      id: lineId,
      name: branch,
      branch,
      tasks,
      dependencies: [],
      state: { type: 'NotStarted' },
      executability: {
        isExecutable: false,
        isAssigned: false,
        isCompleted: false,
        blockedBy: []
      }
    });
  });
  
  return lines;
};

const calculateLineDependencies = (lines: LineView[], allTasks: readonly Task[]): LineView[] => {
  const branchToLineId = new Map<string, LineId>();
  
  for (const line of lines) {
    branchToLineId.set(line.branch, line.id);
  }
  
  return lines.map(line => {
    const lineDeps = new Set<LineId>();
    
    for (const task of line.tasks) {
      for (const depTaskId of task.dependencies) {
        const depTask = allTasks.find(t => t.id === depTaskId);
        if (depTask && depTask.branch !== line.branch) {
          const depLineId = branchToLineId.get(depTask.branch);
          if (depLineId) {
            lineDeps.add(depLineId);
          }
        }
      }
    }
    
    return {
      ...line,
      dependencies: Array.from(lineDeps)
    };
  });
};

const enrichLineWithAnalysis = (line: LineView): LineView => {
  const state = calculateLineState(line.tasks);
  
  return {
    ...line,
    state
  };
};

const calculateLineState = (tasks: readonly Task[]): LineState => {
  if (tasks.length === 0) {
    return { type: 'NotStarted' };
  }
  
  const completedTasks = tasks.filter(task => task.status.type === 'Merged');
  const abandonedTasks = tasks.filter(task => task.status.type === 'Abandoned');
  const blockedTasks = tasks.filter(task => task.status.type === 'Blocked');
  
  if (completedTasks.length === tasks.length) {
    return { type: 'Completed' };
  }
  
  if (abandonedTasks.length > 0) {
    return { type: 'Abandoned' };
  }
  
  if (blockedTasks.length > 0) {
    return { type: 'Blocked' };
  }
  
  const startedTasks = tasks.filter(task => 
    task.status.type !== 'ToBeRefined' && task.status.type !== 'Refined'
  );
  
  if (startedTasks.length > 0) {
    return { type: 'InProgress' };
  }
  
  return { type: 'NotStarted' };
};

const generateLineId = (): LineId => {
  return `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as LineId;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Usage Examples
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/*
// Creating a basic plan view
const planView = planViewQueries.fromPlan(plan, {
  includeCompletedLines: false
});

// Creating a tracking view for parallel execution analysis
const trackingView = trackViewQueries.fromPlan(plan, {
  includeCompletedLines: true,
  includeDetailedStats: true
});

// Building from event stream (event sourcing)
const eventSources = [
  { type: 'PlanCreated', planId: 'plan-1', plan: myPlan },
  { type: 'TaskStatusChanged', taskId: 'task-1', planId: 'plan-1', newStatus: { type: 'InProgress' } }
];

const reconstructedView = planViewQueries.fromEvents(eventSources);

// Using parallel execution stats
if (trackingView) {
  const { parallelExecutionStats } = trackingView.stats;
  console.log(`Executable lines: ${parallelExecutionStats.executableLines}`);
  console.log(`Unassigned lines: ${parallelExecutionStats.unassignedLines}`);
}
*/