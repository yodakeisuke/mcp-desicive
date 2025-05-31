import { z } from 'zod';
import { PlanView } from '../../../domain/read/master_plan/types.js';

// --- request ---
const acceptanceCriterionSchema = z.object({
  scenario: z.string().min(1, "Scenario cannot be empty"),
  given: z.array(z.string().min(1, "Given step cannot be empty"))
    .min(1, "At least one Given step is required"),
  when: z.array(z.string().min(1, "When step cannot be empty"))
    .min(1, "At least one When step is required"),
  then: z.array(z.string().min(1, "Then step cannot be empty"))
    .min(1, "At least one Then step is required")
});

const planToolZodSchema = z.object({
  name: z.string().min(3).describe("Name of the development plan"),
  description: z.string().optional().describe("Optional description of the overall plan"),
  tasks: z.array(z.object({
    id: z.string().min(1).describe("Unique identifier for this task"),
    title: z.string().min(5).describe("Brief title of the PR task"),
    description: z.string().describe("Detailed description of what needs to be implemented"),
    dependencies: z.array(z.string()).optional().describe("Array of task IDs that must be completed before this task"),
    acceptanceCriteria: z.array(acceptanceCriterionSchema)
      .min(1, "At least one acceptance criterion is required")
      .describe("Acceptance criteria in Given-When-Then format"),
    definitionOfReady: z.array(z.string().min(1, "DoR item cannot be empty"))
      .describe("Definition of Ready checklist items")
  })).describe("Array of PR tasks to be included in the plan")
});

export type PlanToolParameters = z.infer<typeof planToolZodSchema>;
export const planParams = planToolZodSchema.shape; // SDKが求める型

// --- response ---
export type PlanToolResponse = {
  id: string;
  name: string;
  description?: string;
  // Tasks are organized by lines for display purposes
  lines: Array<{
    id: string;
    name: string;
    tasks: Array<{
      id: string;
      title: string;
      description: string;
      status: string;
      dependencies: string[];
      acceptanceCriteria: Array<{
        id: string;
        scenario: string;
        given: string[];
        when: string[];
        then: string[];
        isCompleted: boolean;
        createdAt: string;
      }>;
      definitionOfReady: string[];
      assignedTo?: string;
    }>;
  }>;
};

export const planViewToResponse = (view: PlanView): PlanToolResponse => {
  return {
    id: view.plan.id,
    name: view.plan.name,
    description: view.plan.description,
    lines: view.lines.map(line => ({
      id: line.id,
      name: line.name,
      tasks: line.tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status.type,
        dependencies: task.dependencies,
        acceptanceCriteria: task.acceptanceCriteria.map(criterion => ({
          id: criterion.id,
          scenario: criterion.scenario,
          given: [...criterion.given],
          when: [...criterion.when],
          then: [...criterion.then],
          isCompleted: criterion.isCompleted,
          createdAt: criterion.createdAt.toISOString()
        })),
        definitionOfReady: [...task.definitionOfReady],
        assignedTo: task.assignedTo
      }))
    }))
  };
};