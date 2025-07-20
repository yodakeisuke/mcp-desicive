import { Result } from 'neverthrow';
import path from 'path';
import { getDataDirectory, saveJsonFile, readJsonFile, fileExists, FileSystemError } from './filesystem.js';
import { IssueDefinition } from '../mcp/tool/define-issue/schema.js';

/**
 * Get the issue file path
 */
export const getIssueFilePath = (): string => {
  return path.join(getDataDirectory(), 'issue.json');
};

/**
 * Save issue definition to JSON file
 */
export const saveIssueDefinition = async (issueData: IssueDefinition): Promise<Result<void, FileSystemError>> => {
  const filePath = getIssueFilePath();
  return saveJsonFile(filePath, issueData);
};

/**
 * Load issue definition from JSON file
 */
export const loadIssueDefinition = async (): Promise<Result<IssueDefinition, FileSystemError>> => {
  const filePath = getIssueFilePath();
  return readJsonFile<IssueDefinition>(filePath);
};

/**
 * Check if issue definition exists
 */
export const issueDefinitionExists = async (): Promise<boolean> => {
  const filePath = getIssueFilePath();
  return fileExists(filePath);
};