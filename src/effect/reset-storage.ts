import { Result, ok, err } from 'neverthrow';
import { promises as fs } from 'fs';
import { getDataDirectory, type FileSystemError } from './filesystem.js';

/**
 * Reset Storage Effect Layer
 * 
 * Handles deletion of all stored decision-making data.
 */

export type ResetStorageError =
  | { type: 'file_system_error'; error: FileSystemError }
  | { type: 'directory_access_error'; message: string };

/**
 * Delete all decision data files
 */
export const resetAllDecisionData = async (): Promise<Result<void, ResetStorageError>> => {
  try {
    const dataDirectory = getDataDirectory();
    
    // Try to read directory contents
    let files: string[];
    try {
      files = await fs.readdir(dataDirectory);
    } catch (error) {
      // Directory doesn't exist - nothing to delete
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return ok(undefined);
      }
      
      return err({
        type: 'directory_access_error',
        message: `ディレクトリにアクセスできませんでした: ${(error as Error).message}`
      });
    }
    
    // Delete all files in the data directory
    const deletePromises = files.map(async (file) => {
      try {
        await fs.unlink(`${dataDirectory}/${file}`);
      } catch (error) {
        // Ignore individual file deletion errors - file might already be deleted
        console.warn(`Warning: Could not delete file ${file}: ${(error as Error).message}`);
      }
    });
    
    await Promise.all(deletePromises);
    return ok(undefined);
    
  } catch (error) {
    return err({
      type: 'directory_access_error',
      message: `予期しないエラーが発生しました: ${(error as Error).message}`
    });
  }
};