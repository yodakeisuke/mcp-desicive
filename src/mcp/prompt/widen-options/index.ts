import { widenOptionsPromptParams } from './schema.js';
import { widenOptionsPromptHandler } from './handler.js';

export const widenOptionsPrompt = {
  name: 'widen-options',
  description: 'A prompt to guide users through the Widen Options phase of the WRAP process, expanding creative decision-making choices',
  parameters: widenOptionsPromptParams,
  handler: widenOptionsPromptHandler
};