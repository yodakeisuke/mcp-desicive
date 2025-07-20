import { Result, ok, err } from 'neverthrow';
import { loadIssueDefinition } from '../../../effect/issue-storage.js';
import { IssueText, ContextText, ConstraintText } from '../../term/issue-definition.js';
import type { IssueDefinition } from '../../command/define-issue.js';
import type { FileSystemError } from '../../../effect/filesystem.js';
import type { IssueStatusView, ReadError, CurrentStatusQueryResult } from './types.js';

/**
 * Current Status Read Model Implementation
 * 
 * This module provides query functions for retrieving current issue status.
 * It integrates with the effect layer and transforms command model data
 * into read-optimized views.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Data Transformation Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Transform IssueDefinition from command model to IssueStatusView for read model
 * 
 * This function bridges the command and read sides, reusing the same value objects
 * to maintain consistency while providing a read-optimized interface.
 */
const transformToStatusView = (issueDefinition: IssueDefinition): Result<IssueStatusView, ReadError> => {
  try {
    // The command model already uses the same value objects, so we can reuse them directly
    const statusView: IssueStatusView = {
      issue: issueDefinition.issue,
      context: issueDefinition.context,
      constraints: issueDefinition.constraints
    };
    
    return ok(statusView);
  } catch (error) {
    return err({
      type: 'DataCorruption',
      message: 'データの変換中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Map FileSystemError to ReadError
 * 
 * Transforms effect layer errors into read model errors,
 * handling the special case where file-not-found is not an error.
 */
const mapFileSystemError = (fsError: FileSystemError): ReadError | null => {
  // File not found is not an error - it means no issue is defined yet
  if (fsError.originalError && 'code' in fsError.originalError && fsError.originalError.code === 'ENOENT') {
    return null; // This will be handled as "no issue defined" case
  }
  
  return {
    type: 'FileSystemError',
    message: fsError.message,
    originalError: fsError.originalError
  };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Query Functions - Public API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get Current Issue Status Query
 * 
 * Retrieves the current issue status from storage and transforms it into
 * a read-optimized view. Returns null when no issue is defined (not an error).
 * 
 * @returns Promise<Result<IssueStatusView | null, ReadError>>
 *   - Ok(IssueStatusView) when issue exists
 *   - Ok(null) when no issue is defined
 *   - Err(ReadError) when actual errors occur (file system, data corruption)
 */
export const getCurrentIssueStatus = async (): Promise<CurrentStatusQueryResult> => {
  const loadResult = await loadIssueDefinition();
  
  return loadResult.match(
    // Success: Issue definition exists
    (issueDefinition) => transformToStatusView(issueDefinition),
    
    // Error: Handle different error types
    (fsError) => {
      const readError = mapFileSystemError(fsError);
      
      // File not found means no issue is defined - this is OK
      if (readError === null) {
        return ok(null);
      }
      
      // Other file system errors are actual errors
      return err(readError);
    }
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Utility Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Convert IssueStatusView to serializable format for MCP responses
 * 
 * This function converts the domain value objects to plain strings
 * suitable for JSON serialization and MCP tool responses.
 */
export const serializeStatusView = (statusView: IssueStatusView) => {
  if (!statusView) {
    throw new Error('serializeStatusView: statusView is required');
  }
  
  return {
    issue: IssueText.toString(statusView.issue),
    context: ContextText.toString(statusView.context),
    constraints: ConstraintText.toString(statusView.constraints)
  };
};

/**
 * Convert ReadError to user-friendly message
 */
export const formatReadError = (error: ReadError): string => {
  switch (error.type) {
    case 'FileSystemError':
      return `ファイルシステムエラー: ${error.message}`;
    case 'DataCorruption':
      return `データ破損エラー: ${error.message}${error.details ? ` (詳細: ${error.details})` : ''}`;
    default:
      return '不明なエラーが発生しました';
  }
};