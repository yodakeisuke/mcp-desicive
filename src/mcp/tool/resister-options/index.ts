import { registerOptionsParams, registerOptionsOutputSchema } from './schema.js';
import { createRegisterOptionsHandler } from './handler.js';
import { TOOL_DESCRIPTION } from './prompt.js';

export const createRegisterOptionsTool = (server: any) => ({
  name: 'register_options',
  title: 'Register Options',
  description: TOOL_DESCRIPTION,
  parameters: registerOptionsParams,
  outputSchema: registerOptionsOutputSchema,
  handler: createRegisterOptionsHandler(server)
});
