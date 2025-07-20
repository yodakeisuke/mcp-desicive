import { GetPromptResult } from '@modelcontextprotocol/sdk/types.js';
import { IdentifyIssuePromptParams } from './schema.js';
import { IDENTIFY_ISSUE_PROMPT } from './prompt.js';

// Simple template replacement function for Handlebars-like syntax
const processTemplate = (template: string, variables: Record<string, any>): string => {
  let result = template;
  
  // Handle {{#if variable}} blocks
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
    return variables[varName] ? content : '';
  });
  
  // Handle {{variable}} replacements
  result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] || '';
  });
  
  return result;
};

export const identifyIssuePromptHandler = async (args: IdentifyIssuePromptParams): Promise<GetPromptResult> => {
  const processedPrompt = processTemplate(IDENTIFY_ISSUE_PROMPT, {
    problem: args.problem
  });

  return {
    description: "A prompt to help identify and define core issues through iterative dialogue",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: processedPrompt
        }
      }
    ]
  };
};