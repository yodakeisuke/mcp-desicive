import { Result, ok, err } from 'neverthrow';
import { loadOptions } from '../../../effect/options-storage.js';
import type { OptionList, Option } from '../../term/option.js';
import type { FileSystemError } from '../../../effect/filesystem.js';
import type { OptionsView, OptionsReadError, CurrentOptionsQueryResult } from './types.js';

/**
 * Options Read Model Implementation
 * 
 * This module provides query functions for retrieving current options status.
 * It integrates with the effect layer and transforms command model data
 * into read-optimized views.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Data Transformation Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Transform OptionList from command model to OptionsView for read model
 * 
 * This function bridges the command and read sides, reusing the same value objects
 * to maintain consistency while providing a read-optimized interface.
 */
const transformToOptionsView = (optionList: OptionList): Result<OptionsView, OptionsReadError> => {
  try {
    // The command model already uses the same value objects, so we can reuse them directly
    const optionsView: OptionsView = {
      options: optionList.options
    };
    
    return ok(optionsView);
  } catch (error) {
    return err({
      type: 'DataCorruption',
      message: 'データの変換中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Map FileSystemError to OptionsReadError
 * 
 * Transforms effect layer errors into read model errors,
 * handling the special case where file-not-found is not an error.
 */
const mapFileSystemError = (fsError: FileSystemError): OptionsReadError | null => {
  // File not found is not an error - it means no options are defined yet
  if (fsError.originalError && 'code' in fsError.originalError && fsError.originalError.code === 'ENOENT') {
    return null; // This will be handled as "no options defined" case
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
 * Get Current Options Query
 * 
 * Retrieves the current options from storage and transforms them into
 * a read-optimized view. Returns null when no options are defined (not an error).
 * 
 * @returns Promise<Result<OptionsView | null, OptionsReadError>>
 *   - Ok(OptionsView) when options exist
 *   - Ok(null) when no options are defined
 *   - Err(OptionsReadError) when actual errors occur (file system, data corruption)
 */
export const getCurrentOptions = async (): Promise<CurrentOptionsQueryResult> => {
  const loadResult = await loadOptions();
  
  return loadResult.match(
    // Success: Options exist
    (optionList) => transformToOptionsView(optionList),
    
    // Error: Handle different error types
    (fsError) => {
      const readError = mapFileSystemError(fsError);
      
      // File not found means no options are defined - this is OK
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
 * Convert OptionsView to serializable format for MCP responses
 * 
 * This function converts the domain value objects to plain strings
 * suitable for JSON serialization and MCP tool responses.
 */
export const serializeOptionsView = (optionsView: OptionsView) => {
  if (!optionsView) {
    throw new Error('serializeOptionsView: optionsView is required');
  }
  
  return {
    options: optionsView.options.map(option => ({
      id: option.id,
      text: option.text
    }))
  };
};

/**
 * Convert OptionsReadError to user-friendly message
 */
export const formatOptionsReadError = (error: OptionsReadError): string => {
  switch (error.type) {
    case 'FileSystemError':
      return `ファイルシステムエラー: ${error.message}`;
    case 'DataCorruption':
      return `データ破損エラー: ${error.message}${error.details ? ` (詳細: ${error.details})` : ''}`;
    default:
      return '不明なエラーが発生しました';
  }
};