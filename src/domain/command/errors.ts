// =============================================================================
// Command-level Errors (Workflow orchestration errors)
// =============================================================================

export type ValidationError = { type: 'ValidationError'; message: string };
export type StorageError = { type: 'StorageError'; message: string; cause?: Error };

export type WorkflowError = 
  | ValidationError
  | StorageError
  | { type: 'DomainError'; reason: string };

export const WorkflowError = {
  validation: (message: string): WorkflowError => ({ type: 'ValidationError', message }),
  storage: (message: string, cause?: Error): WorkflowError => ({ type: 'StorageError', message, cause }),
  domain: (reason: string): WorkflowError => ({ type: 'DomainError', reason }),
  
  toString: (error: WorkflowError): string => {
    switch (error.type) {
      case 'ValidationError':
        return `Validation error: ${error.message}`;
      case 'StorageError':
        return `Storage error: ${error.message}`;
      case 'DomainError':
        return error.reason;
      default:
        const _exhaustive: never = error;
        throw new Error(`Unknown error type: ${_exhaustive}`);
    }
  }
};