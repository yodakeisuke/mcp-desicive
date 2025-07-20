import { z } from 'zod';

export const defineIssueSchema = z.object({
  issue: z.string()
    .describe("意思決定が必要な課題（1〜30文字）"),
  
  context: z.string()
    .describe("課題の背景情報（マークダウン形式、1〜60文字）"),
  
  constraints: z.string()
    .describe("意思決定における制約条件（マークダウン形式、1〜60文字）")
});

export const defineIssueOutputSchema = z.object({
  issue: z.string().describe("登録された課題")
});

export type DefineIssueParams = z.infer<typeof defineIssueSchema>;
export const defineIssueParams = defineIssueSchema.shape;
export type DefineIssueResponse = z.infer<typeof defineIssueOutputSchema>;