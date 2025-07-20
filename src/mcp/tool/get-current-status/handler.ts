import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { GetCurrentStatusResponse, getCurrentStatusSchema } from './schema.js';
import { toStructuredCallToolResult } from '../util.js';
import { getCurrentIssueStatus, serializeStatusView, formatReadError } from '../../../domain/read/current-status/index.js';
import { getCurrentOptions, serializeOptionsView, formatOptionsReadError } from '../../../domain/read/options/index.js';
import type { IssueStatusView, ReadError } from '../../../domain/read/current-status/types.js';
import type { OptionsView, OptionsReadError } from '../../../domain/read/options/types.js';
import { getCurrentState } from '../../../effect/workflow-state-storage.js';
import { getDisplayName } from '../../../domain/term/workflow-state.js';

/**
 * Get Current Status Tool Handler
 * 
 * 現在定義されている課題（Issue）情報を取得するMCPツールハンドラー
 * 3つのシナリオを処理：
 * 1. 課題が存在する場合
 * 2. 課題が定義されていない場合
 * 3. ファイルシステムエラーが発生した場合
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Response Generation Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Generate success response when issue exists
 */
const generateIssueExistsResponse = async (statusView: IssueStatusView, optionsView: OptionsView | null): Promise<CallToolResult> => {
  const serializedView = serializeStatusView(statusView);
  const serializedOptions = optionsView ? serializeOptionsView(optionsView) : null;
  
  // ワークフロー状態を取得
  const workflowStateResult = await getCurrentState();
  const workflowState = workflowStateResult.isOk() ? workflowStateResult.value : { type: 'undefined' as const };
  
  const nextActionGuidance = optionsView 
    ? "課題と選択肢が定義されています。次のアクションを検討してください：\n" +
      "• Reality-Test Assumptions（仮説を現実検証する）- 前提条件を検証する\n" +
      "• Attain Distance（距離を置いて判断する）- 客観的な視点で評価する\n" +
      "• Prepare to be Wrong（間違いに備える）- リスクと対策を検討する"
    : "課題が定義されています。次のアクションを検討してください：\n" +
      "• Widen Options（選択肢を広げる）- 可能な解決策を洗い出す\n" +
      "• Reality-Test Assumptions（仮説を現実検証する）- 前提条件を検証する\n" +
      "• Attain Distance（距離を置いて判断する）- 客観的な視点で評価する\n" +
      "• Prepare to be Wrong（間違いに備える）- リスクと対策を検討する";

  const structuredData: GetCurrentStatusResponse = {
    workflowState: {
      current: workflowState.type,
      displayName: getDisplayName(workflowState)
    },
    currentStatus: {
      課題: {
        issue: serializedView.issue,
        context: serializedView.context,
        constraints: serializedView.constraints
      },
      選択肢: serializedOptions?.options
    },
    nextActions: nextActionGuidance
  };

  const statusText = `ワークフロー状態: ${getDisplayName(workflowState)}\n現在の課題: ${serializedView.issue}\n背景: ${serializedView.context}\n制約: ${serializedView.constraints}`;
  const optionsText = optionsView 
    ? `\n選択肢: ${serializedOptions?.options.map((opt, idx) => `${idx + 1}. ${opt.text}`).join('\n')}`
    : '';

  return toStructuredCallToolResult(
    [
      statusText + optionsText,
      nextActionGuidance
    ],
    structuredData,
    false
  );
};

/**
 * Generate response when no issue is defined (not an error)
 */
const generateNoIssueResponse = async (): Promise<CallToolResult> => {
  // ワークフロー状態を取得
  const workflowStateResult = await getCurrentState();
  const workflowState = workflowStateResult.isOk() ? workflowStateResult.value : { type: 'undefined' as const };
  
  const nextActionGuidance = 
    "まだ課題が定義されていません。WRAPプロセスを開始するために：\n" +
    "• identify-issue プロンプトを使用して課題を特定してください\n" +
    "• define-issue ツールを使用して課題を定義してください";

  const structuredData: GetCurrentStatusResponse = {
    workflowState: {
      current: workflowState.type,
      displayName: getDisplayName(workflowState)
    },
    currentStatus: {},
    nextActions: nextActionGuidance
  };

  return toStructuredCallToolResult(
    [
      `ワークフロー状態: ${getDisplayName(workflowState)}\n現在、課題は定義されていません。`,
      nextActionGuidance
    ],
    structuredData,
    false
  );
};

/**
 * Generate error response for file system errors
 */
const generateFileSystemErrorResponse = (error: ReadError): CallToolResult => {
  const errorMessage = formatReadError(error);
  
  let correctionGuidance: string;
  
  if (error.type === 'FileSystemError') {
    correctionGuidance = 
      "ファイルシステムエラーの解決方法：\n" +
      "• ファイルの読み取り権限を確認してください\n" +
      "• ファイルが他のプロセスで使用されていないか確認してください\n" +
      "• ディスクの空き容量を確認してください\n" +
      "• 一時的な問題の可能性があるため、しばらく待ってから再実行してください";
  } else if (error.type === 'DataCorruption') {
    correctionGuidance = 
      "データ破損エラーの解決方法：\n" +
      "• 課題を再定義してください（define-issue ツールを使用）\n" +
      "• 破損したファイルを削除して新しく作成することを検討してください\n" +
      "• バックアップがある場合は復元を検討してください";
  } else {
    correctionGuidance = 
      "予期しないエラーの解決方法：\n" +
      "• システムの状態を確認してください\n" +
      "• 問題が継続する場合は、システム管理者に相談してください";
  }

  return toStructuredCallToolResult(
    [
      errorMessage,
      correctionGuidance
    ],
    null,
    true
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Handler Function
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get Current Status Handler
 * 
 * MCPクライアントからの現状把握リクエストを処理し、
 * 構造化された出力形式で課題情報と選択肢情報を返します。
 */
export const getCurrentStatusHandler = async (args: unknown): Promise<CallToolResult> => {
  // Input validation using Zod schema
  const zodResult = getCurrentStatusSchema.safeParse(args);
  if (!zodResult.success) {
    return toStructuredCallToolResult(
      [
        "入力パラメータが無効です。",
        "このツールはパラメータを必要としません。"
      ],
      null,
      true
    );
  }

  // Call domain read models to get current status and options
  const [statusResult, optionsResult] = await Promise.all([
    getCurrentIssueStatus(),
    getCurrentOptions()
  ]);

  // Handle issue status errors
  if (statusResult.isErr()) {
    return generateFileSystemErrorResponse(statusResult.error);
  }

  // Handle options errors (but don't fail the entire request)
  const optionsView = optionsResult.isOk() ? optionsResult.value : null;

  const statusView = statusResult.value;
  
  if (statusView === null) {
    // No issue defined - this is a normal state, not an error
    return await generateNoIssueResponse();
  } else {
    // Issue exists - return structured issue information with options
    return await generateIssueExistsResponse(statusView, optionsView);
  }
};