import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentIssueStatus, serializeStatusView, formatReadError } from './index.js';
import { ok, err } from 'neverthrow';
import * as issueStorageModule from '../../../effect/issue-storage.js';
import { IssueText, ContextText, ConstraintText } from '../../term/issue-definition.js';
import type { IssueDefinition } from '../../command/define-issue.js';
import type { FileSystemError } from '../../../effect/filesystem.js';
import type { IssueStatusView, ReadError } from './types.js';

// Mock the effect layer
vi.mock('../../../effect/issue-storage.js', () => ({
  loadIssueDefinition: vi.fn()
}));

describe('getCurrentIssueStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Success scenarios', () => {
    it('should return IssueStatusView when issue exists', async () => {
      // Given
      const mockIssueDefinition: IssueDefinition = {
        issue: IssueText.create('テスト課題').unwrapOr('' as any),
        context: ContextText.create('テスト背景').unwrapOr('' as any),
        constraints: ConstraintText.create('テスト制約').unwrapOr('' as any)
      };

      vi.mocked(issueStorageModule.loadIssueDefinition).mockResolvedValue(
        ok(mockIssueDefinition)
      );

      // When
      const result = await getCurrentIssueStatus();

      // Then
      expect(result.isOk()).toBe(true);
      const statusView = result.unwrapOr(null);
      expect(statusView).not.toBeNull();
      expect(statusView).toEqual({
        issue: mockIssueDefinition.issue,
        context: mockIssueDefinition.context,
        constraints: mockIssueDefinition.constraints
      });
    });

    it('should return null when no issue is defined (ENOENT)', async () => {
      // Given
      const fileNotFoundError: FileSystemError = {
        tag: 'FileSystemError',
        message: 'ファイルが見つかりません',
        originalError: { code: 'ENOENT' } as any
      };

      vi.mocked(issueStorageModule.loadIssueDefinition).mockResolvedValue(
        err(fileNotFoundError)
      );

      // When
      const result = await getCurrentIssueStatus();

      // Then
      expect(result.isOk()).toBe(true);
      expect(result.unwrapOr(null)).toBeNull();
    });
  });

  describe('Error scenarios', () => {
    it('should return FileSystemError for non-ENOENT file system errors', async () => {
      // Given
      const fsError: FileSystemError = {
        tag: 'FileSystemError',
        message: 'ディスクアクセスエラー',
        originalError: new Error('Disk full')
      };

      vi.mocked(issueStorageModule.loadIssueDefinition).mockResolvedValue(
        err(fsError)
      );

      // When
      const result = await getCurrentIssueStatus();

      // Then
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        const error = result.error;
        expect(error.type).toBe('FileSystemError');
        expect(error.message).toBe('ディスクアクセスエラー');
      }
    });
  });
});

describe('serializeStatusView', () => {
  it('should convert IssueStatusView to plain object', () => {
    // Given
    const statusView: IssueStatusView = {
      issue: IssueText.create('シリアライズテスト').unwrapOr('' as any),
      context: ContextText.create('背景情報').unwrapOr('' as any),
      constraints: ConstraintText.create('制約条件').unwrapOr('' as any)
    };

    // When
    const serialized = serializeStatusView(statusView);

    // Then
    expect(serialized).toEqual({
      issue: 'シリアライズテスト',
      context: '背景情報',
      constraints: '制約条件'
    });
  });
});

describe('formatReadError', () => {
  it('should format FileSystemError', () => {
    // Given
    const error: ReadError = {
      type: 'FileSystemError',
      message: 'アクセス拒否'
    };

    // When
    const formatted = formatReadError(error);

    // Then
    expect(formatted).toBe('ファイルシステムエラー: アクセス拒否');
  });

  it('should format DataCorruption error with details', () => {
    // Given
    const error: ReadError = {
      type: 'DataCorruption',
      message: 'JSON解析エラー',
      details: 'Line 5, Column 12'
    };

    // When
    const formatted = formatReadError(error);

    // Then
    expect(formatted).toBe('データ破損エラー: JSON解析エラー (詳細: Line 5, Column 12)');
  });

  it('should format DataCorruption error without details', () => {
    // Given
    const error: ReadError = {
      type: 'DataCorruption',
      message: 'フォーマットエラー'
    };

    // When
    const formatted = formatReadError(error);

    // Then
    expect(formatted).toBe('データ破損エラー: フォーマットエラー');
  });
});