import { registerOptionsParams, registerOptionsOutputSchema } from './schema.js';
import { registerOptionsHandler } from './handler.js';
import { TOOL_DESCRIPTION } from './prompt.js';

export const registerOptionsTool = {
  name: 'register-options',
  description: TOOL_DESCRIPTION,
  parameters: registerOptionsParams,
  outputSchema: registerOptionsOutputSchema,
  handler: registerOptionsHandler
};