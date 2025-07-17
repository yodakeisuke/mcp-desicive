import { z } from 'zod';

// Input schema
export const exampleToolSchema = z.object({
  message: z.string().min(1).describe("Message to process"),
  count: z.number().int().positive().optional().describe("Number of items to generate")
});

// Output schema
export const exampleOutputSchema = z.object({
  processed: z.string().describe("Processed message"),
  items: z.array(z.object({
    id: z.string().describe("Item ID"),
    value: z.string().describe("Item value")
  })).describe("Generated items"),
  timestamp: z.string().describe("Processing timestamp")
});

export type ExampleToolParams = z.infer<typeof exampleToolSchema>;
export const exampleParams = exampleToolSchema.shape;
export type ExampleResponse = z.infer<typeof exampleOutputSchema>;