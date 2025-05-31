import { planParams } from './schema.js';
import { planEntryPoint } from './handler.js';
import { toolDescription } from './prompt.js';

export const planTool = {
  name: 'plan',
  description: toolDescription,
  parameters: planParams,
  handler: planEntryPoint,
};