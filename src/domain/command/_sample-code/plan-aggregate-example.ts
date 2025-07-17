import { Result, ok, err } from 'neverthrow';

/**
 * Sample Aggregate Pattern Implementation
 * 
 * This demonstrates the Event-Centric Domain Driven Design approach:
 * - Commands produce events, not side effects
 * - Complete rejection of class-based OOP
 * - One business rule = one function
 * - Functional composition with Result types
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Type Modeling Section
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Events - The fundamental output of commands
type PlanEvent =
  | { type: 'PlanCreated'; planId: string; plan: Plan }
  | { type: 'PlanUpdated'; planId: string; plan: Plan }
  | { type: 'PlanDeleted'; planId: string };

// Extract specific event types for type safety
type PlanCreated = Extract<PlanEvent, { type: 'PlanCreated' }>;
type PlanUpdated = Extract<PlanEvent, { type: 'PlanUpdated' }>;

// Domain entity
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
  status: 'todo' | 'in-progress' | 'done';
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Command Types - Define the shape of business operations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Commands are pure functions that produce events or errors
type CreatePlanCommand = (
  request: CreatePlanRequest
) => Result<PlanCreated, PlanError>;

type UpdatePlanCommand = (
  existingPlan: Plan,
  request: UpdatePlanRequest
) => Result<PlanUpdated, PlanError>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Request/Error Types - Input and failure modeling
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type CreatePlanRequest = {
  name: string;
  description: string;
  tasks: Array<{
    title: string;
    description: string;
  }>;
};

type UpdatePlanRequest = {
  name?: string;
  description?: string;
  taskUpdates?: Array<{
    id: string;
    status?: 'todo' | 'in-progress' | 'done';
  }>;
};

// Tagged union for exhaustive error handling
type PlanError =
  | { type: 'ValidationFailed'; reason: string }
  | { type: 'PlanNotFound'; planId: string }
  | { type: 'InvalidStateTransition'; from: string; to: string };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Implementation Section
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Business rule: Validate plan creation request
const validateCreateRequest = (
  request: CreatePlanRequest
): Result<CreatePlanRequest, PlanError> => {
  if (request.name.trim().length === 0) {
    return err({
      type: 'ValidationFailed',
      reason: 'Plan name cannot be empty'
    });
  }
  
  if (request.tasks.length === 0) {
    return err({
      type: 'ValidationFailed',
      reason: 'Plan must have at least one task'
    });
  }
  
  return ok(request);
};

// Command implementation using functional composition
const createPlanCommand: CreatePlanCommand = (request) =>
  validateCreateRequest(request)
    .andThen(validRequest => {
      // Create the plan entity
      const plan: Plan = {
        id: generateId(),
        name: validRequest.name,
        description: validRequest.description,
        tasks: validRequest.tasks.map((t, idx) => ({
          id: `task-${idx}`,
          title: t.title,
          status: 'todo' as const
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Return the event
      const event: PlanCreated = {
        type: 'PlanCreated',
        planId: plan.id,
        plan
      };
      
      return ok(event);
    });

const updatePlanCommand: UpdatePlanCommand = (existingPlan, request) => {
  // Apply updates immutably
  const updatedPlan: Plan = {
    ...existingPlan,
    name: request.name ?? existingPlan.name,
    description: request.description ?? existingPlan.description,
    tasks: existingPlan.tasks.map(task => {
      const update = request.taskUpdates?.find(u => u.id === task.id);
      return update ? { ...task, ...update } : task;
    }),
    updatedAt: new Date()
  };
  
  const event: PlanUpdated = {
    type: 'PlanUpdated',
    planId: updatedPlan.id,
    plan: updatedPlan
  };
  
  return ok(event);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Handling Utilities
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PlanErrorHandler = {
  // Smart constructor for validation errors
  validationFailed: (reason: string): PlanError => ({
    type: 'ValidationFailed',
    reason
  }),
  
  // Convert errors to user-friendly messages
  toString: (error: PlanError): string => {
    switch (error.type) {
      case 'ValidationFailed':
        return `Validation failed: ${error.reason}`;
      case 'PlanNotFound':
        return `Plan not found: ${error.planId}`;
      case 'InvalidStateTransition':
        return `Invalid state transition from ${error.from} to ${error.to}`;
      default:
        // Exhaustive check - TypeScript will error if we miss a case
        const _exhaustive: never = error;
        throw new Error(`Unhandled error type: ${_exhaustive}`);
    }
  }
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Public API - Expose only what's needed
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Plan Aggregate - The public interface for plan-related commands
 * 
 * @command createPlan - Create a new work plan
 * @command updatePlan - Update an existing plan
 * @utility toErrorMessage - Convert errors to user-friendly strings
 */
export const PlanAggregate = {
  createPlan: createPlanCommand,
  updatePlan: updatePlanCommand,
  toErrorMessage: PlanErrorHandler.toString,
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Usage Example
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/*
// Creating a plan
const result = PlanAggregate.createPlan({
  name: 'Q4 Feature Development',
  description: 'New features for Q4 release',
  tasks: [
    { title: 'Design API', description: 'Design REST API endpoints' },
    { title: 'Implement backend', description: 'Implement business logic' }
  ]
});

// Handle the result monadically
result
  .map(event => {
    console.log('Plan created:', event.plan.id);
    // Dispatch event to event store
  })
  .mapErr(error => {
    console.error(PlanAggregate.toErrorMessage(error));
  });

// Chaining operations
const updateResult = result
  .andThen(createEvent =>
    PlanAggregate.updatePlan(createEvent.plan, {
      taskUpdates: [
        { id: 'task-0', status: 'in-progress' }
      ]
    })
  );
*/

// Helper function (would normally be in a separate utility)
function generateId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}