import { exampleParams, exampleOutputSchema } from './schema.js';
import { exampleHandler } from './handler.js';

export const exampleTool = {
  name: 'example',
  title: 'Example Tool',
  description: 'A minimal example tool demonstrating structured output',
  parameters: exampleParams,
  outputSchema: exampleOutputSchema,
  handler: exampleHandler
};