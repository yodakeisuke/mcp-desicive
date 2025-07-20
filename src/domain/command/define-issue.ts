import { Result, ok, err } from 'neverthrow';
import { IssueText, ContextText, ConstraintText } from '../term/issue-definition.js';
import type { ValidationError } from '../term/issue-definition.js';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Type Modeling Section
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Events - The fundamental output of commands
type IssueEvent =
  | { type: 'IssueDefinitionCreated'; issueDefinition: IssueDefinition };

// Extract specific event types for type safety
type IssueDefinitionCreated = Extract<IssueEvent, { type: 'IssueDefinitionCreated' }>;

// Domain entity
type IssueDefinition = {
  issue: IssueText;
  context: ContextText;
  constraints: ConstraintText;
  createdAt: Date;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Command Types - Define the shape of business operations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Commands are pure functions that produce events or errors
type DefineIssueCommand = (
  request: DefineIssueRequest
) => Result<IssueDefinitionCreated, IssueDefinitionError>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Request/Error Types - Input and failure modeling
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type DefineIssueRequest = {
  issue: string;
  context: string;
  constraints: string;
};

// Tagged union for exhaustive error handling
type IssueDefinitionError =
  | { type: 'ValidationFailed'; validationErrors: ValidationError[] };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Implementation Section
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Business rule: Validate issue definition request
const validateDefineRequest = (
  request: DefineIssueRequest
): Result<{ issue: IssueText; context: ContextText; constraints: ConstraintText }, IssueDefinitionError> => {
  const issueResult = IssueText.create(request.issue);
  const contextResult = ContextText.create(request.context);
  const constraintsResult = ConstraintText.create(request.constraints);

  // Collect all validation errors
  const allErrors: ValidationError[] = [];
  
  if (issueResult.isErr()) {
    allErrors.push(...issueResult.error);
  }
  if (contextResult.isErr()) {
    allErrors.push(...contextResult.error);
  }
  if (constraintsResult.isErr()) {
    allErrors.push(...constraintsResult.error);
  }

  if (allErrors.length > 0) {
    return err({
      type: 'ValidationFailed' as const,
      validationErrors: allErrors
    });
  }

  // All validations passed - safe to unwrap
  if (issueResult.isOk() && contextResult.isOk() && constraintsResult.isOk()) {
    return ok({
      issue: issueResult.value,
      context: contextResult.value,
      constraints: constraintsResult.value
    });
  }

  // This should never happen since we already collected all errors above
  throw new Error('Unexpected validation state');
};

// Command implementation using functional composition
const defineIssueCommand: DefineIssueCommand = (request) =>
  validateDefineRequest(request)
    .andThen(validated => {
      // Create the issue definition entity
      const issueDefinition: IssueDefinition = {
        issue: validated.issue,
        context: validated.context,
        constraints: validated.constraints,
        createdAt: new Date()
      };
      
      // Return the event
      const event: IssueDefinitionCreated = {
        type: 'IssueDefinitionCreated',
        issueDefinition
      };
      
      return ok(event);
    });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Handling Utilities
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const IssueDefinitionErrorHandler = {
  // Smart constructor for validation errors
  validationFailed: (validationErrors: ValidationError[]): IssueDefinitionError => ({
    type: 'ValidationFailed',
    validationErrors
  }),
  
  // Convert errors to user-friendly messages
  toString: (error: IssueDefinitionError): string => {
    switch (error.type) {
      case 'ValidationFailed':
        return `Validation failed: ${error.validationErrors.map(e => e.message).join(', ')}`;
      default:
        return `Unknown error type`;
    }
  }
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Public API - Expose only what's needed
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Issue Definition Aggregate - The public interface for issue definition commands
 * 
 * @command defineIssue - Create a new issue definition
 * @utility toErrorMessage - Convert errors to user-friendly strings
 */
export const IssueDefinitionAggregate = {
  defineIssue: defineIssueCommand,
  toErrorMessage: IssueDefinitionErrorHandler.toString,
} as const;

// Export types for other layers
export type { IssueDefinition, IssueDefinitionCreated, DefineIssueRequest, IssueDefinitionError };