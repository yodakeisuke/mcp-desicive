import { Result, ok, err } from 'neverthrow';
import path from 'path';
import { 
  WorkflowState, 
  WorkflowStateSchema, 
  isValidTransition 
} from '../domain/term/workflow-state.js';
import { 
  getDataDirectory, 
  saveJsonFile, 
  readJsonFile, 
  fileExists, 
  FileSystemError 
} from './filesystem.js';

/**
 * ワークフロー状態の永続化エラー
 */
export type WorkflowStateStorageError =
  | { type: 'file_system_error'; error: FileSystemError }
  | { type: 'parse_error'; message: string }
  | { type: 'invalid_transition'; from: WorkflowState; to: WorkflowState };

/**
 * ワークフロー状態ファイルのパスを取得
 */
const getWorkflowStateFilePath = (): string => {
  return path.join(getDataDirectory(), 'workflow-state.json');
};

/**
 * 現在のワークフロー状態を取得
 */
export const getCurrentState = async (): Promise<Result<WorkflowState, WorkflowStateStorageError>> => {
  const filePath = getWorkflowStateFilePath();
  
  // ファイルが存在しない場合は初期状態を返す
  if (!(await fileExists(filePath))) {
    return ok(WorkflowState.undefined());
  }
  
  const result = await readJsonFile<WorkflowState>(filePath);
  
  if (result.isErr()) {
    return err({ type: 'file_system_error', error: result.error });
  }
  
  // Zodでバリデーション
  const validation = WorkflowStateSchema.safeParse(result.value);
  
  if (!validation.success) {
    return err({ 
      type: 'parse_error', 
      message: validation.error.message 
    });
  }
  
  return ok(validation.data);
};

/**
 * ワークフロー状態を更新（遷移ルールをチェック）
 */
export const updateState = async (
  newState: WorkflowState
): Promise<Result<WorkflowState, WorkflowStateStorageError>> => {
  const currentStateResult = await getCurrentState();
  
  if (currentStateResult.isErr()) {
    return err(currentStateResult.error);
  }
  
  const currentState = currentStateResult.value;
  
  // 遷移ルールをチェック
  if (!isValidTransition(currentState, newState)) {
    return err({
      type: 'invalid_transition',
      from: currentState,
      to: newState
    });
  }
  
  return saveState(newState);
};

/**
 * ワークフロー状態を強制的に設定（遷移ルールを無視）
 */
export const forceSetState = async (
  state: WorkflowState
): Promise<Result<WorkflowState, WorkflowStateStorageError>> => {
  return saveState(state);
};

/**
 * 状態をファイルに保存
 */
const saveState = async (
  state: WorkflowState
): Promise<Result<WorkflowState, WorkflowStateStorageError>> => {
  const filePath = getWorkflowStateFilePath();
  const result = await saveJsonFile(filePath, state);
  
  if (result.isErr()) {
    return err({ type: 'file_system_error', error: result.error });
  }
  
  return ok(state);
};