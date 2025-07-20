import { z } from 'zod';

// Input schema
export const generateOptionsSchema = z.object({
  context: z.string().min(1).describe("Context or problem statement for which options should be generated"),
  criteria: z.string().optional().describe("Optional criteria to filter or guide option generation")
});

// Output schema
export const generateOptionsOutputSchema = z.object({
  options: z.array(z.object({
    id: z.string().describe("Unique identifier for the option"),
    title: z.string().describe("Brief title of the option"),
    description: z.string().describe("Detailed description of the option")
  })).min(3).max(5).describe("Generated options (3-5 items)"),
  context: z.string().describe("Original context that was processed"),
  timestamp: z.string().describe("Generation timestamp")
});

export type GenerateOptionsParams = z.infer<typeof generateOptionsSchema>;
export const generateOptionsParams = generateOptionsSchema.shape;
export type GenerateOptionsResponse = z.infer<typeof generateOptionsOutputSchema>;