import { z } from 'zod';

/**
 * Get Current Status Tool Schema
 * 
 * 現在定義されている課題（Issue）情報を取得するためのMCPツールスキーマ
 */

// Input schema - パラメータなし（現在の課題情報を単純に取得）
export const getCurrentStatusSchema = z.object({});

// Output schema - 構造化された課題情報とワークフロー状態
export const getCurrentStatusOutputSchema = z.object({
  workflowState: z.object({
    current: z.string().describe("現在のワークフロー状態"),
    displayName: z.string().describe("状態の日本語表示名")
  }).describe("ワークフロー状態"),
  currentStatus: z.object({
    課題: z.object({
      issue: z.string().optional().describe("課題のタイトル"),
      context: z.string().optional().describe("課題の背景情報"),
      constraints: z.string().optional().describe("制約条件")
    }).optional().describe("課題情報"),
    選択肢: z.array(z.object({
      id: z.string().describe("選択肢の一意識別子"),
      text: z.string().describe("選択肢のテキスト")
    })).optional().describe("登録された選択肢")
  }).describe("現在の課題状況"),
  nextActions: z.string().describe("推奨される次のアクション")
});

// TypeScript types derived from schemas
export type GetCurrentStatusParams = z.infer<typeof getCurrentStatusSchema>;
export const getCurrentStatusParams = getCurrentStatusSchema.shape;
export type GetCurrentStatusResponse = z.infer<typeof getCurrentStatusOutputSchema>;