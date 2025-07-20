import { z } from 'zod';

// Input schema for the prompt with optional problem parameter
export const identifyIssuePromptSchema = z.object({
  problem: z.string().optional().describe("Problem description provided by the user")
});

export type IdentifyIssuePromptParams = z.infer<typeof identifyIssuePromptSchema>;
export const identifyIssuePromptParams = identifyIssuePromptSchema.shape;