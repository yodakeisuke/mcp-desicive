import { WorkPlan } from '../../term/plan/work_plan.js';
import { PlanEvent } from '../../command/plan/events.js';
import { PlanView, LineView } from './types.js';
import { projections } from './projections.js';

// =============================================================================
// Read Model Query Operations
// =============================================================================

export const planViewQueries = {
  /**
   * Reconstruct current plan view from events
   */
  fromEvents: (events: PlanEvent[]): PlanView | null => {
    const plan = projections.fromEvents(events);
    if (!plan) {
      return null;
    }
    
    const lines = projections.deriveLines(plan);
    const stats = projections.calculateStats(plan, lines);
    
    return {
      plan,
      lines,
      stats,
      lastUpdated: new Date()
    };
  },

  /**
   * Create plan view from current plan state
   */
  fromPlan: (plan: WorkPlan): PlanView => {
    const lines = projections.deriveLines(plan);
    const stats = projections.calculateStats(plan, lines);
    
    return {
      plan,
      lines,
      stats,
      lastUpdated: new Date()
    };
  },

  /**
   * Get parallelizable lines for optimization
   */
  getParallelizableLines: (view: PlanView): LineView[] => {
    return view.lines.filter(line => line.dependencies.length === 0);
  },

  /**
   * Get critical path analysis
   */
  getCriticalPath: (view: PlanView): LineView[] => {
    return [];
  }
} as const;