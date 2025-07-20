import { Result } from 'neverthrow';
import { Option, OptionId, OptionText } from '../../term/option.js';

/**
 * Options Read Model Types
 * 
 * This module defines the read-side types for querying current options status.
 * Following CQRS pattern, these are optimized for query operations.
 * Reuses existing term model value objects for consistency.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Read Model View Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Options View - Query-optimized representation of current options
 * 
 * This view reuses existing term model value objects to maintain consistency
 * with the command side while being optimized for query operations.
 * All fields are readonly to enforce immutability.
 */
export type OptionsView = {
  readonly options: readonly Option[];
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Types - Read Operation Failures
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Options Read Error - Categorized failures during read operations
 * 
 * Distinguishes between different types of read failures:
 * - FileSystemError: Infrastructure failures (disk, permissions, etc.)
 * - DataCorruption: Invalid or corrupted data format
 */
export type OptionsReadError = 
  | { readonly type: 'FileSystemError'; readonly message: string; readonly originalError?: Error }
  | { readonly type: 'DataCorruption'; readonly message: string; readonly details?: string };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Query Result Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Current Options Query Result
 * 
 * Returns null when no options are defined (not an error condition)
 * Returns OptionsReadError for actual failures (file system, data corruption)
 */
export type CurrentOptionsQueryResult = Result<OptionsView | null, OptionsReadError>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Constructors - Smart constructors for error creation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const OptionsReadError = {
  fileSystemError: (message: string, originalError?: Error): OptionsReadError => ({
    type: 'FileSystemError',
    message,
    originalError
  }),
  
  dataCorruption: (message: string, details?: string): OptionsReadError => ({
    type: 'DataCorruption',
    message,
    details
  })
} as const;