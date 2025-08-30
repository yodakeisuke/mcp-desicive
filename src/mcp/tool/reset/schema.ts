import { z } from 'zod';

// Reset tool takes no parameters
export const resetSchema = z.object({});

export const resetOutputSchema = z.object({
  success: z.boolean().describe("リセット処理が成功したかどうか"),
  message: z.string().describe("リセット処理の結果メッセージ")
});

export const resetParams = resetSchema.shape;
export type ResetParams = z.infer<typeof resetSchema>;
export type ResetResponse = z.infer<typeof resetOutputSchema>;