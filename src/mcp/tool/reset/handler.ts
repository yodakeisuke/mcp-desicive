import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ResetDecisionAggregate } from '../../../domain/command/reset-decision.js';
import { resetAllDecisionData } from '../../../effect/reset-storage.js';
import { toStructuredCallToolResult } from '../util.js';
import type { ResetParams, ResetResponse } from './schema.js';

/**
 * Reset handler - すべての保存データを削除し、意思決定プロセスを白紙に戻す
 */
export const resetHandler = async (args: ResetParams): Promise<CallToolResult> => {
  // Domain command を実行してイベントを生成
  const commandResult = ResetDecisionAggregate.resetDecision({});
  
  if (commandResult.isErr()) {
    const response: ResetResponse = {
      success: false,
      message: ResetDecisionAggregate.toErrorMessage(commandResult.error)
    };

    return toStructuredCallToolResult(
      ["❌ リセットコマンドの実行に失敗しました", JSON.stringify(response, null, 2)],
      response,
      true
    );
  }

  // イベントが生成されたので、Effect層でストレージ操作を実行
  const storageResult = await resetAllDecisionData();
  
  if (storageResult.isErr()) {
    const errorMessage = storageResult.error.type === 'file_system_error' 
      ? storageResult.error.error.message
      : storageResult.error.message;
    
    const response: ResetResponse = {
      success: false,
      message: `リセット処理中にエラーが発生しました: ${storageResult.error.type} - ${errorMessage}`
    };

    return toStructuredCallToolResult(
      ["❌ リセット処理中にエラーが発生しました", JSON.stringify(response, null, 2)],
      response,
      true
    );
  }

  const response: ResetResponse = {
    success: true,
    message: "すべてのデータが削除され、意思決定プロセスが白紙に戻りました"
  };

  return toStructuredCallToolResult(
    [
      "✅ 意思決定プロセスをリセットしました",
      "",
      "📝 削除されたデータ:",
      "• 課題定義 (issue.json)",
      "• 選択肢一覧 (options.json)", 
      "• ワークフロー状態 (workflow-state.json)",
      "",
      `🕐 リセット時刻: ${commandResult.value.timestamp.toISOString()}`,
      "",
      "🔄 新しい意思決定プロセスを開始できます",
      "",
      JSON.stringify(response, null, 2)
    ],
    response,
    false
  );
};