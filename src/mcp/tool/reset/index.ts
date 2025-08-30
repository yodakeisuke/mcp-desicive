import { resetParams, resetOutputSchema } from './schema.js';
import { resetHandler } from './handler.js';

const toolDescription = `意思決定プロセスを完全にリセットし、すべての保存データを削除します。

このツールは以下の操作を実行します:
• 課題定義の削除
• 選択肢リストの削除  
• ワークフロー状態の初期化
• すべての関連ファイルの削除

新しい意思決定プロセスを開始したい時に使用してください。。`;

export const resetTool = {
  name: 'reset',
  title: 'Reset Decision Process',
  description: toolDescription,
  parameters: resetParams,
  outputSchema: resetOutputSchema,
  handler: resetHandler
};