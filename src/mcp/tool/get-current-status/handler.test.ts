import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentStatusHandler } from './handler.js';
import { ok, err } from 'neverthrow';
import * as currentStatusModule from '../../../domain/read/current-status/index.js';
import { IssueText, ContextText, ConstraintText } from '../../../domain/term/issue-definition.js';
import type { IssueStatusView, ReadError } from '../../../domain/read/current-status/types.js';

// Mock the domain read model
vi.mock('../../../domain/read/current-status/index.js', () => ({
  getCurrentIssueStatus: vi.fn(),
  serializeStatusView: vi.fn((statusView: IssueStatusView) => ({
    issue: IssueText.toString(statusView.issue),
    context: ContextText.toString(statusView.context),
    constraints: ConstraintText.toString(statusView.constraints)
  })),
  formatReadError: vi.fn((error: ReadError) => {
    switch (error.type) {
      case 'FileSystemError':
        return `ファイルシステムエラー: ${error.message}`;
      case 'DataCorruption':
        return `データ破損エラー: ${error.message}${error.details ? ` (詳細: ${error.details})` : ''}`;
      default:
        return '不明なエラーが発生しました';
    }
  })
}));

describe('getCurrentStatusHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scenario: Issue exists', () => {
    it('should return structured issue information when issue is defined', async () => {
      // Given
      const mockIssueView: IssueStatusView = {
        issue: IssueText.create('ユーザー登録フローの改善').unwrapOr('' as any),
        context: ContextText.create('現在の登録完了率が60%と低い').unwrapOr('' as any),
        constraints: ConstraintText.create('リソースは現状のまま').unwrapOr('' as any)
      };

      vi.mocked(currentStatusModule.getCurrentIssueStatus).mockResolvedValue(
        ok(mockIssueView)
      );

      // When
      const result = await getCurrentStatusHandler({});

      // Then
      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(2);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: '現在の課題: ユーザー登録フローの改善\n背景: 現在の登録完了率が60%と低い\n制約: リソースは現状のまま'
      });
      expect(result.structuredContent).toEqual({
        currentStatus: {
          hasIssue: true,
          issue: 'ユーザー登録フローの改善',
          context: '現在の登録完了率が60%と低い',
          constraints: 'リソースは現状のまま'
        },
        nextActions: expect.stringContaining('Widen Options')
      });
    });
  });

  describe('Scenario: No issue defined', () => {
    it('should return guidance message when no issue is defined', async () => {
      // Given
      vi.mocked(currentStatusModule.getCurrentIssueStatus).mockResolvedValue(
        ok(null)
      );

      // When
      const result = await getCurrentStatusHandler({});

      // Then
      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(2);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: '現在、課題は定義されていません。'
      });
      expect(result.structuredContent).toEqual({
        currentStatus: {
          hasIssue: false
        },
        nextActions: expect.stringContaining('identify-issue')
      });
    });
  });

  describe('Scenario: File system error', () => {
    it('should return error message with correction guidance for file system errors', async () => {
      // Given
      const mockError: ReadError = {
        type: 'FileSystemError',
        message: 'ファイルの読み取りに失敗しました',
        originalError: new Error('EACCES: permission denied')
      };

      vi.mocked(currentStatusModule.getCurrentIssueStatus).mockResolvedValue(
        err(mockError)
      );

      // When
      const result = await getCurrentStatusHandler({});

      // Then
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(2);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'ファイルシステムエラー: ファイルの読み取りに失敗しました'
      });
      expect(result.structuredContent).toBeNull();
    });
  });

  describe('Scenario: Data corruption error', () => {
    it('should return error message with recovery guidance for data corruption', async () => {
      // Given
      const mockError: ReadError = {
        type: 'DataCorruption',
        message: 'JSONの解析に失敗しました',
        details: 'Unexpected token at position 42'
      };

      vi.mocked(currentStatusModule.getCurrentIssueStatus).mockResolvedValue(
        err(mockError)
      );

      // When
      const result = await getCurrentStatusHandler({});

      // Then
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(2);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'データ破損エラー: JSONの解析に失敗しました (詳細: Unexpected token at position 42)'
      });
      expect(result.content[1].text).toContain('データ破損エラーの解決方法');
      expect(result.structuredContent).toBeNull();
    });
  });

  describe('Input validation', () => {
    it('should accept empty object as valid input', async () => {
      // Given - getCurrentStatus doesn't require parameters
      const validInput = {};
      
      // Mock successful response
      vi.mocked(currentStatusModule.getCurrentIssueStatus).mockResolvedValue(
        ok(null)
      );

      // When
      const result = await getCurrentStatusHandler(validInput);

      // Then
      expect(result.isError).toBe(false);
      expect(result.structuredContent).toEqual({
        currentStatus: {
          hasIssue: false
        },
        nextActions: expect.stringContaining('identify-issue')
      });
    });

    it('should accept additional parameters without error', async () => {
      // Given - Extra parameters should be ignored
      const inputWithExtra = { someParam: 'unexpected' };
      
      // Mock successful response
      vi.mocked(currentStatusModule.getCurrentIssueStatus).mockResolvedValue(
        ok(null)
      );

      // When
      const result = await getCurrentStatusHandler(inputWithExtra);

      // Then - Should work normally, ignoring extra params
      expect(result.isError).toBe(false);
      expect(result.structuredContent).toEqual({
        currentStatus: {
          hasIssue: false
        },
        nextActions: expect.stringContaining('identify-issue')
      });
    });
  });
});