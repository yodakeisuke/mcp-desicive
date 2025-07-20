import { Result, ok, err } from 'neverthrow';
import { OptionListModel, type Option, type OptionList, type RequestedOptionList, type OptionListError } from '../term/option.js';

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
type GenerateOptionsCommand = (
  request: GenerateOptionsRequest
) => Result<OptionsGenerated, OptionSelectionError>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Request/Error Types - Input and failure modeling
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type GenerateOptionsRequest = {
  context: string;
  criteria?: string;
};

// Tagged union for exhaustive error handling
type OptionSelectionError =
  | { type: 'ValidationFailed'; reason: string }
  | { type: 'OptionListCreationFailed'; details: OptionListError[] };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Implementation Section
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Business rule: Validate request
const validateGenerateRequest = (
  request: GenerateOptionsRequest
): Result<GenerateOptionsRequest, OptionSelectionError> => {
  if (request.context.trim().length === 0) {
    return err({
      type: 'ValidationFailed',
      reason: 'Context cannot be empty'
    });
  }
  
  return ok(request);
};

// Business rule: Generate options based on context using term models
const generateOptionList = (request: GenerateOptionsRequest): Result<OptionList, OptionSelectionError> => {
  // For now, generate placeholder options
  // In real implementation, this would use AI or predefined logic
  const baseOptions = [
    {
      title: "Option A",
      description: `Solution approach A for: ${request.context}`
    },
    {
      title: "Option B", 
      description: `Solution approach B for: ${request.context}`
    },
    {
      title: "Option C",
      description: `Solution approach C for: ${request.context}`
    },
    {
      title: "Option D",
      description: `Solution approach D for: ${request.context}`
    }
  ];

  // Apply criteria if provided
  const filteredOptions = request.criteria 
    ? baseOptions.filter(opt => 
        opt.description.toLowerCase().includes(request.criteria!.toLowerCase())
      )
    : baseOptions;

  // Ensure we have 3-5 options (business rule)
  const finalOptions = filteredOptions.slice(0, 5);
  if (finalOptions.length < 3) {
    // Pad with additional generic options to meet minimum
    while (finalOptions.length < 3) {
      finalOptions.push({
        title: `Additional Option ${finalOptions.length + 1}`,
        description: `Additional solution for: ${request.context}`
      });
    }
  }

  // Use term model to create properly validated OptionList
  const requestedOptionList: RequestedOptionList = {
    options: finalOptions
  };

  return OptionListModel.create(requestedOptionList)
    .mapErr(errors => ({
      type: 'OptionListCreationFailed' as const,
      details: errors
    }));
};

// Command implementation using functional composition
const generateOptionsCommand: GenerateOptionsCommand = (request) =>
  validateGenerateRequest(request)
    .andThen(validRequest => 
      generateOptionList(validRequest)
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
 * @command generateOptions - Generate 3-5 options based on context
 * @utility toErrorMessage - Convert errors to user-friendly strings
 */
export const OptionSelectionAggregate = {
  generateOptions: generateOptionsCommand,
  toErrorMessage: OptionSelectionErrorHandler.toString,
} as const;

// Export types for other layers
export type { OptionsGenerated, GenerateOptionsRequest, OptionSelectionError };