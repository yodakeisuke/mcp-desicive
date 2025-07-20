import { Result, ok, err } from 'neverthrow';
import { join } from 'path';
import type { OptionList } from '../domain/term/option.js';
import { saveJsonFile, readJsonFile, type FileSystemError } from './filesystem.js';

/**
 * Options Storage Effect Layer
 * 
 * Handles persistence of options to the file system.
 * Uses similar patterns to issue-storage.ts for consistency.
 */

// Configuration
const STORAGE_DIR = '.mcp-decisive';
const OPTIONS_FILENAME = 'options.json';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Storage Operations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get the full path to the options file
 */
const getOptionsFilePath = (): string => {
  return join(process.cwd(), STORAGE_DIR, OPTIONS_FILENAME);
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