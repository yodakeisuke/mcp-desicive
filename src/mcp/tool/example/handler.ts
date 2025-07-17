import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ExampleToolParams, ExampleResponse } from './schema.js';
import { toStructuredCallToolResult } from '../util.js';

export const exampleHandler = async (args: ExampleToolParams): Promise<CallToolResult> => {
  try {
    // Simple processing logic
    const count = args.count || 3;
    const items = Array.from({ length: count }, (_, i) => ({
      id: `item-${i + 1}`,
      value: `${args.message}-${i + 1}`
    }));

    const response: ExampleResponse = {
      processed: `Processed: ${args.message}`,
      items,
      timestamp: new Date().toISOString()
    };

    const textMessage = `Successfully processed "${args.message}" and generated ${count} items.`;
    
    return toStructuredCallToolResult(
      [textMessage, JSON.stringify(response, null, 2)],
      response,
      false
    );
  } catch (error) {
    return toStructuredCallToolResult(
      [`Error processing request: ${(error as Error).message}`],
      null,
      true
    );
  }
};