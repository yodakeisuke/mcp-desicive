import { generateOptionsParams, generateOptionsOutputSchema } from './schema.js';
import { generateOptionsHandler } from './handler.js';

const toolDescription = `Generate 3-5 options based on the provided context.

This tool helps with decision-making by providing multiple structured options for a given situation or problem. The tool enforces business rules ensuring exactly 3-5 options are always generated.

Usage examples:
- "What should I have for lunch today?"
- "How can I improve my team's productivity?"
- "What are the approaches to solve this technical problem?"`;

export const generateOptionsTool = {
  name: 'generate-options',
  description: toolDescription,
  parameters: generateOptionsParams,
  outputSchema: generateOptionsOutputSchema,
  handler: generateOptionsHandler
};