import { GetPromptResult } from '@modelcontextprotocol/sdk/types.js';
import { WidenOptionsPromptParams } from './schema.js';
import { WIDEN_OPTIONS_PROMPT } from './prompt.js';

export const widenOptionsPromptHandler = async (args: WidenOptionsPromptParams): Promise<GetPromptResult> => {
  return {
    description: "A prompt to guide users through the Widen Options phase of the WRAP process",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: WIDEN_OPTIONS_PROMPT
        }
      }
    ]
  };
};