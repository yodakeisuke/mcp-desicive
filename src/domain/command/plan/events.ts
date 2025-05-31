import { WorkPlan } from '../../term/plan/work_plan.js';
import { WorkPlanId } from '../../term/plan/work_plan_id.js';

/**
 * 語彙「計画イベント」
 * domain type: event
 */

// -- modeling --
// Event types
export type PlanEvent =
  | { type: 'PlanCreated'; planId: WorkPlanId; plan: WorkPlan; timestamp: Date }
  | { type: 'PlanUpdated'; planId: WorkPlanId; plan: WorkPlan; timestamp: Date }
  | { type: 'TaskStatusChanged'; planId: WorkPlanId; taskId: string; oldStatus: string; newStatus: string; timestamp: Date }
  | { type: 'TasksAdded'; planId: WorkPlanId; taskIds: string[]; timestamp: Date }
  | { type: 'DependenciesChanged'; planId: WorkPlanId; taskId: string; oldDeps: string[]; newDeps: string[]; timestamp: Date };

// -- implementation --
// Event factory functions
export const PlanEvent = {
  planCreated: (planId: WorkPlanId, plan: WorkPlan): PlanEvent => ({
    type: 'PlanCreated',
    planId,
    plan,
    timestamp: new Date()
  }),
  
  planUpdated: (planId: WorkPlanId, plan: WorkPlan): PlanEvent => ({
    type: 'PlanUpdated',
    planId,
    plan,
    timestamp: new Date()
  }),
  
  taskStatusChanged: (planId: WorkPlanId, taskId: string, oldStatus: string, newStatus: string): PlanEvent => ({
    type: 'TaskStatusChanged',
    planId,
    taskId,
    oldStatus,
    newStatus,
    timestamp: new Date()
  }),

  tasksAdded: (planId: WorkPlanId, taskIds: string[]): PlanEvent => ({
    type: 'TasksAdded',
    planId,
    taskIds,
    timestamp: new Date()
  }),

  dependenciesChanged: (planId: WorkPlanId, taskId: string, oldDeps: string[], newDeps: string[]): PlanEvent => ({
    type: 'DependenciesChanged',
    planId,
    taskId,
    oldDeps,
    newDeps,
    timestamp: new Date()
  })
} as const;