import { WorkPlan } from '../../term/plan/work_plan.js';
import { PlanEvent } from '../../command/plan/events.js';
import { LineView, PlanViewStats } from './types.js';
import { LineId } from './types.js';
import { PrTask } from '../../term/task/pr_task.js';

// =============================================================================
// Event → State Projection Operations
// =============================================================================

const eventProjections = {
  /**
   * Apply events to reconstruct current state with complete event replay
   */
  projectPlanState: (events: PlanEvent[]): WorkPlan | null => {
    let currentPlan: WorkPlan | null = null;
    
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
          throw new Error(`Unhandled event type: ${event satisfies never}`);
      }
    }
    
    return currentPlan;
  }
} as const;

// Helper functions for state reconstruction
const updateTaskStatusInPlan = (plan: WorkPlan, taskId: string, newStatus: string): WorkPlan => {
  const updatedTasks = plan.tasks.map(task => {
    if (task.id.toString() === taskId) {
      const status = { type: newStatus } as any;
      return { ...task, status, updatedAt: new Date() };
    }
    return task;
  });

  return {
    ...plan,
    tasks: updatedTasks,
    updatedAt: new Date()
  };
};

const addTasksToPlan = (plan: WorkPlan, taskIds: string[]): WorkPlan => {
  return {
    ...plan,
    updatedAt: new Date()
  };
};

const updateTaskDependenciesInPlan = (plan: WorkPlan, taskId: string, newDeps: string[]): WorkPlan => {
  const updatedTasks = plan.tasks.map(task => {
    if (task.id.toString() === taskId) {
      const dependencies = newDeps as any;
      return { ...task, dependencies, updatedAt: new Date() };
    }
    return task;
  });

  return {
    ...plan,
    tasks: updatedTasks,
    updatedAt: new Date()
  };
};

// Line derivation operations
const lineProjections = {
  /**
   * Derive development lines from plan tasks
   */
  deriveFromPlan: (plan: WorkPlan): LineView[] => {
    const tasksByBranch = new Map<string, PrTask[]>();
    
    for (const task of plan.tasks) {
      const tasks = tasksByBranch.get(task.branch) || [];
      tasks.push(task);
      tasksByBranch.set(task.branch, tasks);
    }

    const lines: LineView[] = [];
    const branchToLineId = new Map<string, LineId>();
    
    for (const [branch, tasks] of tasksByBranch) {
      const lineId = LineId.generate();
      branchToLineId.set(branch, lineId);
      
      lines.push({
        id: lineId,
        name: branch,
        branch,
        tasks,
        dependencies: []
      });
    }

    for (const line of lines) {
      const lineDeps = new Set<LineId>();
      
      for (const task of line.tasks) {
        for (const depTaskId of task.dependencies) {
          const depTask = plan.tasks.find(t => t.id === depTaskId);
          if (depTask && depTask.branch !== line.branch) {
            const depLineId = branchToLineId.get(depTask.branch);
            if (depLineId) {
              lineDeps.add(depLineId);
            }
          }
        }
      }
      
      line.dependencies = Array.from(lineDeps);
    }

    return lines;
  }
} as const;

// Helper function to calculate plan statistics
const calculatePlanStats = (plan: WorkPlan) => {
  const tasksByStatus: Record<string, number> = {
    'ToBeRefined': 0,
    'Refined': 0,
    'Implemented': 0,
    'Reviewed': 0,
    'QAPassed': 0,
    'Blocked': 0,
    'Abandoned': 0
  };
  const tasksByBranch: Record<string, number> = {};

  let estimatedTotalHours = 0;
  let hasEstimates = false;

  for (const task of plan.tasks) {
    // Count by status
    tasksByStatus[task.status.type] = (tasksByStatus[task.status.type] || 0) + 1;
    
    // Count by branch
    tasksByBranch[task.branch] = (tasksByBranch[task.branch] || 0) + 1;
    
    // Sum estimates
    if (task.estimatedHours) {
      estimatedTotalHours += task.estimatedHours;
      hasEstimates = true;
    }
  }

  return {
    totalTasks: plan.tasks.length,
    tasksByStatus,
    tasksByBranch,
    estimatedTotalHours: hasEstimates ? estimatedTotalHours : undefined
  };
};

// Statistics calculation operations
const statsProjections = {
  /**
   * Calculate comprehensive plan statistics
   */
  calculateFromPlanAndLines: (plan: WorkPlan, lines: LineView[]): PlanViewStats => {
    const baseStats = calculatePlanStats(plan);
    
    const parallelizableLines = lines.filter(line => line.dependencies.length === 0).length;
    
    return {
      ...baseStats,
      totalLines: lines.length,
      parallelizableLines,
    };
  }
} as const;

// =============================================================================
// Public Projection API
// =============================================================================

export const projections = {
  fromEvents: eventProjections.projectPlanState,
  deriveLines: lineProjections.deriveFromPlan,
  calculateStats: statsProjections.calculateFromPlanAndLines
} as const;