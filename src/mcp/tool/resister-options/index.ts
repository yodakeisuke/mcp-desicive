import { registerOptionsParams, registerOptionsOutputSchema } from './schema.js';
import { registerOptionsHandler } from './handler.js';
import { TOOL_DESCRIPTION } from './prompt.js';

export const registerOptionsTool = {
  name: 'register_options',
  title: 'Register Options',
  description: TOOL_DESCRIPTION,
  parameters: registerOptionsParams,
  outputSchema: registerOptionsOutputSchema,
  handler: registerOptionsHandler
};