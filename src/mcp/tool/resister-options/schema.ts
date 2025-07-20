import { z } from 'zod';

// Input schema
export const registerOptionsSchema = z.object({
  options: z.array(z.string().max(30, "各選択肢は30文字以内で入力してください"))
    .min(3, "選択肢は3個以上で入力してください")
    .max(5, "選択肢は5個以下で入力してください")
    .describe("選択肢のリスト（各項目30文字まで、3-5個）")
});

// Output schema
export const registerOptionsOutputSchema = z.object({
  options: z.array(z.object({
    id: z.string().describe("選択肢の一意識別子"),
    text: z.string().describe("選択肢のテキスト")
  })).min(3).max(5).describe("登録された選択肢（3-5個）")
});

export type RegisterOptionsParams = z.infer<typeof registerOptionsSchema>;
export const registerOptionsParams = registerOptionsSchema.shape;
export type RegisterOptionsResponse = z.infer<typeof registerOptionsOutputSchema>;