import { z } from 'zod';

/**
 * Get Current Status Tool Schema
 * 
 * 現在定義されている課題（Issue）情報を取得するためのMCPツールスキーマ
 */

// Input schema - パラメータなし（現在の課題情報を単純に取得）
export const getCurrentStatusSchema = z.object({});

// Output schema - 構造化された課題情報とネクストアクション
export const getCurrentStatusOutputSchema = z.object({
  currentStatus: z.object({
    hasIssue: z.boolean().describe("課題が定義されているかどうか"),
    issue: z.string().optional().describe("課題のタイトル"),
    context: z.string().optional().describe("課題の背景情報"),
    constraints: z.string().optional().describe("制約条件")
  }).describe("現在の課題状況"),
  nextActions: z.string().describe("推奨される次のアクション")
});

// TypeScript types derived from schemas
export type GetCurrentStatusParams = z.infer<typeof getCurrentStatusSchema>;
export const getCurrentStatusParams = getCurrentStatusSchema.shape;
export type GetCurrentStatusResponse = z.infer<typeof getCurrentStatusOutputSchema>;