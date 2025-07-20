import { promises as fs } from 'fs';
import { Result, ok, err } from 'neverthrow';
import path from 'path';
import os from 'os';

/**
 * File system error types for better error categorization
 */
export interface FileSystemError {
  type: 'permission_denied' | 'directory_create_failed' | 'file_write_failed' | 'disk_full' | 'unknown';
  message: string;
  originalError: Error;
}

/**
 * Categorize file system errors based on error codes and messages
 */
const categorizeFileSystemError = (error: Error, operation: string): FileSystemError => {
  const errorMessage = error.message.toLowerCase();
  const nodeError = error as NodeJS.ErrnoException;

  if (nodeError.code === 'EACCES' || nodeError.code === 'EPERM' || errorMessage.includes('permission')) {
    return {
      type: 'permission_denied',
      message: `権限エラー: ${operation}の権限がありません`,
      originalError: error
    };
  }

  if (nodeError.code === 'ENOSPC' || errorMessage.includes('no space')) {
    return {
      type: 'disk_full',
      message: `ディスク容量不足: ${operation}に必要な容量がありません`,
      originalError: error
    };
  }

  if (operation === 'ディレクトリ作成' && (nodeError.code === 'ENOTDIR' || nodeError.code === 'EEXIST')) {
    return {
      type: 'directory_create_failed',
      message: `ディレクトリ作成失敗: ${error.message}`,
      originalError: error
    };
  }

  if (operation === 'ファイル書き込み' && (nodeError.code === 'EISDIR' || nodeError.code === 'ENOENT')) {
    return {
      type: 'file_write_failed',
      message: `ファイル書き込み失敗: ${error.message}`,
      originalError: error
    };
  }

  return {
    type: 'unknown',
    message: `${operation}中に予期しないエラーが発生しました: ${error.message}`,
    originalError: error
  };
};

/**
 * Get the data directory path for mcp-decisive
 */
export const getDataDirectory = (): string => {
  // Allow override for testing
  const testDataDir = process.env.MCP_DECISIVE_TEST_DATA_DIR;
  if (testDataDir) {
    return testDataDir;
  }
  return path.join(os.tmpdir(), 'mcp-decisive-data');
};

/**
 * Ensure directory exists with detailed error handling
 */
export const ensureDirectory = async (dirPath: string): Promise<Result<void, FileSystemError>> => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return ok(undefined);
  } catch (error) {
    const fsError = categorizeFileSystemError(error as Error, 'ディレクトリ作成');
    return err(fsError);
  }
};

/**
 * Save JSON data to file with detailed error handling
 */
export const saveJsonFile = async <T>(
  filePath: string, 
  data: T
): Promise<Result<void, FileSystemError>> => {
  // Ensure directory exists first
  const dirPath = path.dirname(filePath);
  const dirResult = await ensureDirectory(dirPath);
  if (dirResult.isErr()) {
    return err(dirResult.error);
  }

  // Prepare JSON data
  const jsonData = JSON.stringify(data, null, 2);

  try {
    await fs.writeFile(filePath, jsonData, 'utf-8');
    return ok(undefined);
  } catch (error) {
    const fsError = categorizeFileSystemError(error as Error, 'ファイル書き込み');
    return err(fsError);
  }
};

/**
 * Read JSON data from file with detailed error handling
 */
export const readJsonFile = async <T>(filePath: string): Promise<Result<T, FileSystemError>> => {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent) as T;
    return ok(data);
  } catch (error) {
    const fsError = categorizeFileSystemError(error as Error, 'ファイル読み込み');
    return err(fsError);
  }
};

/**
 * Check if file exists
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};