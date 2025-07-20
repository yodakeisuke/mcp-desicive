import { Result, ok, err } from 'neverthrow';
import { OptionListModel, type Option, type OptionList, type RequestedOptionList, type RequestedOption, type OptionListError } from '../term/option.js';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Type Modeling Section
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Events - The fundamental output of commands
type OptionSelectionEvent =
  | { type: 'OptionsGenerated'; optionList: OptionList };

// Extract specific event types for type safety
type OptionsGenerated = Extract<OptionSelectionEvent, { type: 'OptionsGenerated' }>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Command Types - Define the shape of business operations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Commands are pure functions that produce events or errors
type RegisterOptionsCommand = (
  request: RegisterOptionsRequest
) => Result<OptionsGenerated, OptionSelectionError>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Request/Error Types - Input and failure modeling
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type RegisterOptionsRequest = {
  options: RequestedOption[];
};

// Tagged union for exhaustive error handling
type OptionSelectionError =
  | { type: 'ValidationFailed'; reason: string }
  | { type: 'OptionListCreationFailed'; details: OptionListError[] };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Implementation Section
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Business rule: Validate request
const validateRegisterRequest = (
  request: RegisterOptionsRequest
): Result<RegisterOptionsRequest, OptionSelectionError> => {
  if (!request.options || request.options.length === 0) {
    return err({
      type: 'ValidationFailed',
      reason: 'Options list cannot be empty'
    });
  }
  
  return ok(request);
};

// Business rule: Register options directly using term models
const registerOptionList = (request: RegisterOptionsRequest): Result<OptionList, OptionSelectionError> => {
  // Use term model to create properly validated OptionList
  const requestedOptionList: RequestedOptionList = {
    options: request.options
  };

  return OptionListModel.create(requestedOptionList)
    .mapErr(errors => ({
      type: 'OptionListCreationFailed' as const,
      details: errors
    }));
};

// Command implementation using functional composition
const registerOptionsCommand: RegisterOptionsCommand = (request) =>
  validateRegisterRequest(request)
    .andThen(validRequest => 
      registerOptionList(validRequest)
        .andThen(optionList => {
          const event: OptionsGenerated = {
            type: 'OptionsGenerated',
            optionList
          };
          
          return ok(event);
        })
    );

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Handling Utilities
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const OptionSelectionErrorHandler = {
  // Smart constructor for validation errors
  validationFailed: (reason: string): OptionSelectionError => ({
    type: 'ValidationFailed',
    reason
  }),
  
  // Convert errors to user-friendly messages
  toString: (error: OptionSelectionError): string => {
    switch (error.type) {
      case 'ValidationFailed':
        return `Validation failed: ${error.reason}`;
      case 'OptionListCreationFailed':
        return `Option list creation failed: ${error.details.map(d => d.message).join(', ')}`;
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
 * Option Selection Aggregate - The public interface for option selection commands
 * 
 * @command registerOptions - Register 3-5 options directly
 * @utility toErrorMessage - Convert errors to user-friendly strings
 */
export const OptionSelectionAggregate = {
  registerOptions: registerOptionsCommand,
  toErrorMessage: OptionSelectionErrorHandler.toString,
} as const;

// Export types for other layers
export type { OptionsGenerated, RegisterOptionsRequest, OptionSelectionError };