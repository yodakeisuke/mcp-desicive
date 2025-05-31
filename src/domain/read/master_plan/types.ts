import { WorkPlan } from '../../term/plan/work_plan.js';
import { PrTask } from '../../term/task/pr_task.js';
import { ID, NonEmptyString } from '../../../common/primitive.js';
import { Result } from 'neverthrow';

// ID types
export type LineId = ID<'Line'>;
export const LineId = {
  create: (value: string): Result<LineId, string> => {
    return NonEmptyString.from(value)
      .map(nes => nes.value as LineId);
  },
  generate: (): LineId => {
    return `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as LineId;
  },
  value: (id: LineId): string => ID.value(id)
} as const;

// =============================================================================
// Read Model Type Definitions
// =============================================================================

// Snapshot state representation of a development line
export type LineView = {
  id: LineId;
  name: string;
  branch: string;
  tasks: PrTask[];
  dependencies: LineId[];
};

// Current plan view (snapshot state)
export type PlanView = {
  plan: WorkPlan;
  lines: LineView[];
  stats: PlanViewStats;
  lastUpdated: Date;
};

export type PlanViewStats = {
  totalTasks: number;
  totalLines: number;
  tasksByStatus: Record<string, number>;
  tasksByBranch: Record<string, number>;
  estimatedTotalHours?: number;
  parallelizableLines: number;
  criticalPathLength?: number;
};