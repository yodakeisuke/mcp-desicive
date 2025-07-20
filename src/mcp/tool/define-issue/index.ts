import { defineIssueParams, defineIssueOutputSchema } from './schema.js';
import { defineIssueHandler } from './handler.js';

export const defineIssueTool = {
  name: 'define_issue',
  description: 'WRAP意思決定フレームワークの課題定義段階を支援するツール。課題、コンテキスト、制約を構造化して保存し、意思決定プロセスを開始します。',
  parameters: defineIssueParams,
  outputSchema: defineIssueOutputSchema,
  handler: defineIssueHandler
};