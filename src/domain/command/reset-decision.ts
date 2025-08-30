import { Result, ok } from 'neverthrow';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Type Modeling Section
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Events - The fundamental output of commands
type ResetEvent =
  | { type: 'DecisionProcessReset'; timestamp: Date };

// Extract specific event types for type safety
type DecisionProcessReset = Extract<ResetEvent, { type: 'DecisionProcessReset' }>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Command Types - Define the shape of business operations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Commands are pure functions that produce events or errors
type ResetDecisionCommand = (
  request: ResetDecisionRequest
) => Result<DecisionProcessReset, ResetDecisionError>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Request/Error Types - Input and failure modeling
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type ResetDecisionRequest = {
  // No parameters needed for reset
};

// Tagged union for exhaustive error handling
type ResetDecisionError =
  | { type: 'ResetFailed'; reason: string };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Implementation Section
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Business rule: Always allow reset (no validation needed)
const validateResetRequest = (
  request: ResetDecisionRequest
): Result<ResetDecisionRequest, ResetDecisionError> => {
  return ok(request);
};

// Command implementation using functional composition
const resetDecisionCommand: ResetDecisionCommand = (request) =>
  validateResetRequest(request)
    .andThen(() => {
      // Create the reset event
      const event: DecisionProcessReset = {
        type: 'DecisionProcessReset',
        timestamp: new Date()
      };
      
      return ok(event);
    });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Handling Utilities
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ResetDecisionErrorHandler = {
  // Smart constructor for reset errors
  resetFailed: (reason: string): ResetDecisionError => ({
    type: 'ResetFailed',
    reason
  }),
  
  // Convert errors to user-friendly messages
  toString: (error: ResetDecisionError): string => {
    switch (error.type) {
      case 'ResetFailed':
        return `Reset failed: ${error.reason}`;
      default:
        return `Unknown error type`;
    }
  }
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Public API - Expose only what's needed
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Reset Decision Aggregate - The public interface for resetting decision process
 * 
 * @command resetDecision - Reset the entire decision process
 * @utility toErrorMessage - Convert errors to user-friendly strings
 */
export const ResetDecisionAggregate = {
  resetDecision: resetDecisionCommand,
  toErrorMessage: ResetDecisionErrorHandler.toString,
} as const;

// Export types for other layers
export type { DecisionProcessReset, ResetDecisionRequest, ResetDecisionError };