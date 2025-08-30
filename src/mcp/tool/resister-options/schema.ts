import { z } from 'zod';
import { WidenOptionsStepsSchema } from '../../../domain/term/widen-options-steps.js';

// Input schema
export const registerOptionsSchema = z.object({
  options: z.array(z.union([
    z.string().max(30, "各選択肢は30文字以内で入力してください"),
    z.object({
      text: z.string().max(30, "各選択肢は30文字以内で入力してください"),
      supplementaryInfo: z.string().optional().describe("選択肢の補足情報（オプション）")
    })
  ]))
    .min(3, "選択肢は3個以上で入力してください")
    .describe("選択肢のリスト（各項目30文字まで、3個以上）。5個を超える場合は対話的に間引きを行います。文字列または{text, supplementaryInfo}オブジェクトで指定"),
  widenOptionsStep: WidenOptionsStepsSchema
    .describe("この操作が対応するWidenOptionsStepsの種類")
});

// Output schema
export const registerOptionsOutputSchema = z.object({
  options: z.array(z.object({
    id: z.string().describe("選択肢の一意識別子"),
    text: z.string().describe("選択肢のテキスト"),
    supplementaryInfo: z.string().optional().describe("選択肢の補足情報（オプション）")
  })).min(3).max(5).describe("登録された選択肢（3-5個）"),
  widenOptionsStep: WidenOptionsStepsSchema.describe("現在の選択肢拡張ステップ")
});

export type RegisterOptionsParams = z.infer<typeof registerOptionsSchema>;
export const registerOptionsParams = registerOptionsSchema.shape;
export type RegisterOptionsResponse = z.infer<typeof registerOptionsOutputSchema>;
