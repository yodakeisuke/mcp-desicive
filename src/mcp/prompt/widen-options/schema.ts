import { z } from 'zod';

// Input schema for the widen-options prompt (no parameters needed)
export const widenOptionsPromptSchema = z.object({});

export type WidenOptionsPromptParams = z.infer<typeof widenOptionsPromptSchema>;
export const widenOptionsPromptParams = widenOptionsPromptSchema.shape;