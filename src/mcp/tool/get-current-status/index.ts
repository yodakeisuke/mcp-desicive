import { getCurrentStatusParams, getCurrentStatusOutputSchema } from './schema.js';
import { getCurrentStatusHandler } from './handler.js';

export const getCurrentStatusTool = {
  name: 'get_current_status',
  description: 'WRAP意思決定フレームワークにおいて現在定義されている課題（Issue）情報を取得するツール。意思決定プロセスの現状把握と次のアクション決定を支援します。',
  parameters: getCurrentStatusParams,
  outputSchema: getCurrentStatusOutputSchema,
  handler: getCurrentStatusHandler
};