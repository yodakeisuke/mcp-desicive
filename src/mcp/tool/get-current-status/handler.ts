import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { GetCurrentStatusResponse, getCurrentStatusSchema } from './schema.js';
import { toStructuredCallToolResult } from '../util.js';
import { getCurrentIssueStatus, serializeStatusView, formatReadError } from '../../../domain/read/current-status/index.js';
import type { IssueStatusView, ReadError } from '../../../domain/read/current-status/types.js';

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
const generateIssueExistsResponse = (statusView: IssueStatusView): CallToolResult => {
  const serializedView = serializeStatusView(statusView);
  
  const nextActionGuidance = 
    "課題が定義されています。次のアクションを検討してください：\n" +
    "• Widen Options（選択肢を広げる）- 可能な解決策を洗い出す\n" +
    "• Reality-Test Assumptions（仮説を現実検証する）- 前提条件を検証する\n" +
    "• Attain Distance（距離を置いて判断する）- 客観的な視点で評価する\n" +
    "• Prepare to be Wrong（間違いに備える）- リスクと対策を検討する";

  const structuredData: GetCurrentStatusResponse = {
    currentStatus: {
      hasIssue: true,
      issue: serializedView.issue,
      context: serializedView.context,
      constraints: serializedView.constraints
    },
    nextActions: nextActionGuidance
  };

  return toStructuredCallToolResult(
    [
      `現在の課題: ${serializedView.issue}\n背景: ${serializedView.context}\n制約: ${serializedView.constraints}`,
      nextActionGuidance
    ],
    structuredData,
    false
  );
};

/**
 * Generate response when no issue is defined (not an error)
 */
const generateNoIssueResponse = (): CallToolResult => {
  const nextActionGuidance = 
    "まだ課題が定義されていません。WRAPプロセスを開始するために：\n" +
    "• identify-issue プロンプトを使用して課題を特定してください\n" +
    "• define-issue ツールを使用して課題を定義してください";

  const structuredData: GetCurrentStatusResponse = {
    currentStatus: {
      hasIssue: false
    },
    nextActions: nextActionGuidance
  };

  return toStructuredCallToolResult(
    [
      "現在、課題は定義されていません。",
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
 * 構造化された出力形式で課題情報を返します。
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

  // Call domain read model to get current status
  const statusResult = await getCurrentIssueStatus();

  return statusResult.match(
    // Success: Handle both issue exists and no issue cases
    (statusView) => {
      if (statusView === null) {
        // No issue defined - this is a normal state, not an error
        return generateNoIssueResponse();
      } else {
        // Issue exists - return structured issue information
        return generateIssueExistsResponse(statusView);
      }
    },
    
    // Error: Handle file system and data corruption errors
    (error) => generateFileSystemErrorResponse(error)
  );
};