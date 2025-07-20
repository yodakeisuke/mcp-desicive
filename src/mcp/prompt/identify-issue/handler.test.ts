import { describe, it, expect } from 'vitest';
import { identifyIssuePromptHandler } from './handler.js';

describe('identifyIssuePromptHandler', () => {
  it('should return a prompt with correct structure', async () => {
    const result = await identifyIssuePromptHandler({});

    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('messages');
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]).toHaveProperty('role', 'user');
    expect(result.messages[0]).toHaveProperty('content');
    expect(result.messages[0].content).toHaveProperty('type', 'text');
    expect(result.messages[0].content).toHaveProperty('text');
  });

  it('should include Japanese response instruction in prompt text', async () => {
    const result = await identifyIssuePromptHandler({});
    const promptText = result.messages[0].content.text;

    expect(promptText).toContain('respond to users in Japanese');
  });

  it('should include issue structure requirements in prompt text', async () => {
    const result = await identifyIssuePromptHandler({});
    const promptText = result.messages[0].content.text;

    expect(promptText).toContain('Problem/Challenge');
    expect(promptText).toContain('Context and Purpose');
    expect(promptText).toContain('Constraints');
  });

  it('should define role as problem definition expert', async () => {
    const result = await identifyIssuePromptHandler({});
    const promptText = result.messages[0].content.text;

    expect(promptText).toContain('problem definition and issue identification expert');
    expect(promptText).toContain('iterative dialogue');
  });

  it('should process template without problem', async () => {
    const result = await identifyIssuePromptHandler({});
    const promptText = result.messages[0].content.text;

    // Should not contain the conditional block when no problem is provided
    expect(promptText).not.toContain('{{#if problem}}');
    expect(promptText).not.toContain('{{problem}}');
    expect(promptText).not.toContain('{{/if}}');
  });

  it('should process template with problem', async () => {
    const problem = "Our team is struggling with productivity";
    const result = await identifyIssuePromptHandler({ problem: problem });
    const promptText = result.messages[0].content.text;

    // Should include the problem in the processed text
    expect(promptText).toContain(problem);
    expect(promptText).toContain('The user has presented the following problem:');
    expect(promptText).toContain('Start by analyzing this.');

    // Should not contain template syntax
    expect(promptText).not.toContain('{{#if problem}}');
    expect(promptText).not.toContain('{{problem}}');
    expect(promptText).not.toContain('{{/if}}');
  });

  it('should handle empty problem', async () => {
    const result = await identifyIssuePromptHandler({ problem: '' });
    const promptText = result.messages[0].content.text;

    // Should not include the conditional block when problem is empty
    expect(promptText).not.toContain('The user has presented the following problem:');
    expect(promptText).not.toContain('{{#if problem}}');
  });
});