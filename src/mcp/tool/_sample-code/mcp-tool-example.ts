import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Minimal MCP Tool Example
 * 
 * This demonstrates the basic MCP Tool pattern with structured output:
 * - Zod schema for input/output validation
 * - Title field for human-friendly display name
 * - Simple handler function
 * - Structured output response
 */

// Input schema
const exampleSchema = z.object({
  message: z.string().min(1).describe("Message to process"),
  count: z.number().int().positive().optional().describe("Number of items to generate")
});

// Output schema
const exampleOutputSchema = z.object({
  processed: z.string().describe("Processed message"),
  items: z.array(z.object({
    id: z.string().describe("Item ID"),
    value: z.string().describe("Item value")
  })).describe("Generated items"),
  timestamp: z.string().describe("Processing timestamp")
});

export type ExampleParams = z.infer<typeof exampleSchema>;
export const exampleParams = exampleSchema.shape;

// Handler implementation
export const exampleHandler = async (args: ExampleParams): Promise<CallToolResult> => {
  try {
    const count = args.count || 3;
    const items = Array.from({ length: count }, (_, i) => ({
      id: `item-${i + 1}`,
      value: `${args.message}-${i + 1}`
    }));

    const response = {
      processed: `Processed: ${args.message}`,
      items,
      timestamp: new Date().toISOString()
    };

    return {
      content: [
        { type: "text", text: `Successfully processed "${args.message}"` },
        { type: "text", text: JSON.stringify(response, null, 2) }
      ],
      structuredContent: response,
      isError: false
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
      isError: true
    };
  }
};

// Tool definition
export const exampleTool = {
  name: 'example',
  title: 'Example Tool',
  description: 'A minimal example tool demonstrating structured output',
  parameters: exampleParams,
  outputSchema: exampleOutputSchema,
  handler: exampleHandler
};