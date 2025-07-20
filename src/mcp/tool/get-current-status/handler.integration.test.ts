import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCurrentStatusHandler } from './handler.js';
import { defineIssueHandler } from '../define-issue/handler.js';
import { IssueDefinition } from '../../../domain/command/define-issue.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test data directory
const TEST_DATA_DIR = path.join(__dirname, '../../../../.test-data');
const ISSUE_FILE_PATH = path.join(TEST_DATA_DIR, 'issue.json');

describe('getCurrentStatus Integration Tests', () => {
  beforeEach(async () => {
    // Set test data directory environment variable
    process.env.MCP_DECISIVE_TEST_DATA_DIR = TEST_DATA_DIR;
    
    // Create test data directory
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch {
      // Ignore errors if directory doesn't exist
    }
    
    // Clean up environment variable
    delete process.env.MCP_DECISIVE_TEST_DATA_DIR;
  });

  describe('End-to-end scenarios', () => {
    it('should return empty state when no issue is defined', async () => {
      // When
      const result = await getCurrentStatusHandler({});

      // Then
      expect(result.isError).toBe(false);
      expect(result.structuredContent).toEqual({
        currentStatus: {
          hasIssue: false
        },
        nextActions: expect.stringContaining('identify-issue')
      });
      expect(result.content.some(c => c.text.includes('課題は定義されていません'))).toBe(true);
    });

    it('should return issue information after issue is defined', async () => {
      // Given - Define an issue first
      const defineResult = await defineIssueHandler({
        issue: 'E2Eテストシステムの構築',
        context: 'テスト自動化が不十分で手動テストに時間がかかっている',
        constraints: 'CI/CDパイプラインとの統合が必須'
      });
      expect(defineResult.isError).toBe(false);

      // When - Get current status
      const statusResult = await getCurrentStatusHandler({});

      // Then
      expect(statusResult.isError).toBe(false);
      expect(statusResult.structuredContent).toMatchObject({
        currentStatus: {
          hasIssue: true,
          issue: 'E2Eテストシステムの構築',
          context: 'テスト自動化が不十分で手動テストに時間がかかっている',
          constraints: 'CI/CDパイプラインとの統合が必須'
        },
        nextActions: expect.stringContaining('Widen Options')
      });
    });

    it('should handle corrupted issue file gracefully', async () => {
      // Given - Create a corrupted issue file
      await fs.writeFile(ISSUE_FILE_PATH, 'invalid json content', 'utf-8');

      // When
      const result = await getCurrentStatusHandler({});

      // Then
      expect(result.isError).toBe(true);
      // JSON parse error is treated as FileSystemError in our implementation
      expect(result.content.some(c => 
        c.text.includes('ファイルシステムエラー') || 
        c.text.includes('データ破損エラー')
      )).toBe(true);
      expect(result.structuredContent).toBeNull();
    });

    it('should handle permission errors gracefully', async () => {
      // Skip this test on Windows as file permissions work differently
      if (process.platform === 'win32') {
        return;
      }

      // Given - Create a file and make it unreadable
      await defineIssueHandler({
        issue: '権限テスト課題',
        context: 'ファイルアクセス権限のテスト',
        constraints: '読み取り権限なし'
      });
      
      await fs.chmod(ISSUE_FILE_PATH, 0o000);

      try {
        // When
        const result = await getCurrentStatusHandler({});

        // Then
        expect(result.isError).toBe(true);
        expect(result.content.some(c => c.text.includes('ファイルシステムエラー'))).toBe(true);
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(ISSUE_FILE_PATH, 0o644);
      }
    });
  });

  describe('Workflow integration', () => {
    it('should support WRAP decision-making workflow', async () => {
      // Given - No issue initially
      const initialStatus = await getCurrentStatusHandler({});
      expect(initialStatus.structuredContent.currentStatus.hasIssue).toBe(false);

      // When - Define an issue (simulating identify-issue prompt result)
      await defineIssueHandler({
        issue: '開発環境の標準化',
        context: 'チームメンバー間で開発環境が統一されていない',
        constraints: '既存プロジェクトへの影響を最小限にする'
      });

      // Then - Verify issue is properly stored and retrievable
      const afterDefineStatus = await getCurrentStatusHandler({});
      expect(afterDefineStatus.structuredContent.currentStatus.hasIssue).toBe(true);
      expect(afterDefineStatus.content.some(c => 
        c.text.includes('Widen Options') || 
        c.text.includes('Reality-Test Assumptions')
      )).toBe(true);

      // Verify the structured data can be used for next steps
      const { currentStatus, nextActions } = afterDefineStatus.structuredContent;
      expect(currentStatus.issue).toBeDefined();
      expect(currentStatus.context).toBeDefined();
      expect(currentStatus.constraints).toBeDefined();
      expect(nextActions).toBeDefined();
    });
  });
});