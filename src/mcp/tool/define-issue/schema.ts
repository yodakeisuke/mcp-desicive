import { z } from 'zod';

// Input schema for define_issue tool
export const defineIssueSchema = z.object({
  issue: z.string()
    .min(1, "課題は必須です")
    .max(30, "課題は30文字以内で入力してください")
    .describe("意思決定が必要な課題（1〜30文字）"),
  
  context: z.string()
    .min(1, "コンテキストは必須です")
    .max(60, "コンテキストは60文字以内で入力してください")
    .describe("課題の背景情報（マークダウン形式、1〜60文字）"),
  
  constraints: z.string()
    .min(1, "制約は必須です")
    .max(60, "制約は60文字以内で入力してください")
    .describe("意思決定における制約条件（マークダウン形式、1〜60文字）")
});

// Output schema for structured response
export const defineIssueOutputSchema = z.object({
  issue: z.string().describe("登録された課題")
});

export type DefineIssueParams = z.infer<typeof defineIssueSchema>;
export const defineIssueParams = defineIssueSchema.shape;
export type DefineIssueResponse = z.infer<typeof defineIssueOutputSchema>;

// Internal data structure for JSON storage
export interface IssueDefinition {
  issue: string;
  context: string;
  constraints: string;
}