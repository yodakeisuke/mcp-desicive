import { Result } from 'neverthrow';
import { IssueText, ContextText, ConstraintText } from '../../term/issue-definition.js';

/**
 * Current Status Read Model Types
 * 
 * This module defines the read-side types for querying current issue status.
 * Following CQRS pattern, these are optimized for query operations.
 * Reuses existing term model value objects for consistency.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Read Model View Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Issue Status View - Query-optimized representation of current issue status
 * 
 * This view reuses existing term model value objects to maintain consistency
 * with the command side while being optimized for query operations.
 * All fields are readonly to enforce immutability.
 */
export type IssueStatusView = {
  readonly issue: IssueText;
  readonly context: ContextText;
  readonly constraints: ConstraintText;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Types - Read Operation Failures
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Read Error - Categorized failures during read operations
 * 
 * Distinguishes between different types of read failures:
 * - FileSystemError: Infrastructure failures (disk, permissions, etc.)
 * - DataCorruption: Invalid or corrupted data format
 */
export type ReadError = 
  | { readonly type: 'FileSystemError'; readonly message: string; readonly originalError?: Error }
  | { readonly type: 'DataCorruption'; readonly message: string; readonly details?: string };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Query Result Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Current Status Query Result
 * 
 * Returns null when no issue is defined (not an error condition)
 * Returns ReadError for actual failures (file system, data corruption)
 */
export type CurrentStatusQueryResult = Result<IssueStatusView | null, ReadError>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Constructors - Smart constructors for error creation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ReadError = {
  fileSystemError: (message: string, originalError?: Error): ReadError => ({
    type: 'FileSystemError',
    message,
    originalError
  }),
  
  dataCorruption: (message: string, details?: string): ReadError => ({
    type: 'DataCorruption',
    message,
    details
  })
} as const;