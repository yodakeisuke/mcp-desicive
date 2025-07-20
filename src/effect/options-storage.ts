import { Result, ok, err } from 'neverthrow';
import path from 'path';
import type { OptionList } from '../domain/term/option.js';
import { saveJsonFile, readJsonFile, getDataDirectory, type FileSystemError } from './filesystem.js';

/**
 * Options Storage Effect Layer
 * 
 * Handles persistence of options to the file system.
 * Uses similar patterns to issue-storage.ts for consistency.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Storage Operations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get the full path to the options file
 */
const getOptionsFilePath = (): string => {
  return path.join(getDataDirectory(), 'options.json');
};

/**
 * Save options to storage
 */
export const saveOptions = async (optionList: OptionList): Promise<Result<void, FileSystemError>> => {
  const filePath = getOptionsFilePath();
  return await saveJsonFile(filePath, optionList);
};

/**
 * Load options from storage
 */
export const loadOptions = async (): Promise<Result<OptionList, FileSystemError>> => {
  const filePath = getOptionsFilePath();
  return await readJsonFile<OptionList>(filePath);
};