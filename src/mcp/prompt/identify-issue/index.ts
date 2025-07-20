import { identifyIssuePromptParams } from './schema.js';
import { identifyIssuePromptHandler } from './handler.js';

export const identifyIssuePrompt = {
  name: 'identify-the-issue',
  description: 'A prompt to help identify and define core issues through iterative dialogue as a problem definition expert',
  parameters: identifyIssuePromptParams,
  handler: identifyIssuePromptHandler
};