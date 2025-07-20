import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { defineIssueHandler } from './handler.js';
import { DefineIssueParams } from './schema.js';
import path from 'path';
import os from 'os';

// 統合テスト専用のデータディレクトリを使用
const INTEGRATION_DATA_DIR = path.join(os.tmpdir(), 'mcp-decisive-integration-test');
const INTEGRATION_ISSUE_FILE = path.join(INTEGRATION_DATA_DIR, 'issue.json');

describe('defineIssueHandler - ファイルシステム統合テスト', () => {
  beforeEach(async () => {
    // Clean up before each test
    try {
      await fs.rm(INTEGRATION_DATA_DIR, { recursive: true, force: true });
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch {
      // Directory might not exist, ignore error
    }

    // Set environment variable to override data directory
    process.env.MCP_DECISIVE_TEST_DATA_DIR = INTEGRATION_DATA_DIR;
  });

  afterEach(async () => {
    // Clean up environment variable
    delete process.env.MCP_DECISIVE_TEST_DATA_DIR;
    
    try {
      await fs.rm(INTEGRATION_DATA_DIR, { recursive: true, force: true });
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch {
      // Directory might not exist, ignore error
    }
  });

  describe('実際のファイル作成・上書きテスト', () => {
    it('初回実行時にデータディレクトリとJSONファイルが作成される', async () => {
      // 事前条件: データディレクトリが存在しない
      const dirExistsBefore = await fs.access(INTEGRATION_DATA_DIR).then(() => true).catch(() => false);
      expect(dirExistsBefore).toBe(false);

      const params: DefineIssueParams = {
        issue: '統合テスト課題',
        context: '統合テストのコンテキスト',
        constraints: '統合テストの制約'
      };

      // ハンドラーを実行
      const result = await defineIssueHandler(params);

      // 成功することを確認
      expect(result.isError).toBe(false);

      // データディレクトリが作成されていることを確認
      const dirExistsAfter = await fs.access(INTEGRATION_DATA_DIR).then(() => true).catch(() => false);
      expect(dirExistsAfter).toBe(true);

      // JSONファイルが作成されていることを確認
      const fileExists = await fs.access(INTEGRATION_ISSUE_FILE).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // ファイル内容が正しいことを確認
      const fileContent = await fs.readFile(INTEGRATION_ISSUE_FILE, 'utf-8');
      const savedData = JSON.parse(fileContent);
      expect(savedData).toEqual({
        issue: '統合テスト課題',
        context: '統合テストのコンテキスト',
        constraints: '統合テストの制約'
      });
    });

    it('複数回の上書きが正常に動作する', async () => {
      const testCases = [
        { issue: '1回目', context: '1回目コンテキスト', constraints: '1回目制約' },
        { issue: '2回目', context: '2回目コンテキスト', constraints: '2回目制約' },
        { issue: '3回目', context: '3回目コンテキスト', constraints: '3回目制約' }
      ];

      for (const params of testCases) {
        const result = await defineIssueHandler(params);
        expect(result.isError).toBe(false);

        // ファイル内容が正しく更新されていることを確認
        const fileContent = await fs.readFile(INTEGRATION_ISSUE_FILE, 'utf-8');
        const savedData = JSON.parse(fileContent);
        expect(savedData).toEqual(params);
      }
    });

    it('JSONファイルが適切にフォーマットされて保存される', async () => {
      const params: DefineIssueParams = {
        issue: 'フォーマットテスト',
        context: 'インデント確認',
        constraints: 'JSON構造テスト'
      };

      await defineIssueHandler(params);

      // ファイル内容を文字列として確認
      const fileContent = await fs.readFile(INTEGRATION_ISSUE_FILE, 'utf-8');
      
      // JSONが適切にインデントされていることを確認
      expect(fileContent).toContain('{\n  "issue"');
      expect(fileContent).toContain('  "context"');
      expect(fileContent).toContain('  "constraints"');
      
      // パースできることを確認
      expect(() => JSON.parse(fileContent)).not.toThrow();
    });

    it('既存ファイルが存在する場合、正常に上書きされる', async () => {
      // 最初のデータを保存
      const firstParams: DefineIssueParams = {
        issue: '最初の課題',
        context: '最初のコンテキスト',
        constraints: '最初の制約'
      };
      
      const firstResult = await defineIssueHandler(firstParams);
      expect(firstResult.isError).toBe(false);

      // ファイルが作成されていることを確認
      const fileExists = await fs.access(INTEGRATION_ISSUE_FILE).then(() => true).catch(() => false);
      if (!fileExists) {
        throw new Error('First file was not created');
      }

      let fileContent = await fs.readFile(INTEGRATION_ISSUE_FILE, 'utf-8');
      let savedData = JSON.parse(fileContent);
      expect(savedData.issue).toBe('最初の課題');

      // 2回目のデータで上書き
      const secondParams: DefineIssueParams = {
        issue: '上書きされた課題',
        context: '上書きされたコンテキスト',
        constraints: '上書きされた制約'
      };

      const secondResult = await defineIssueHandler(secondParams);
      expect(secondResult.isError).toBe(false);

      // ファイル内容が更新されていることを確認
      fileContent = await fs.readFile(INTEGRATION_ISSUE_FILE, 'utf-8');
      savedData = JSON.parse(fileContent);
      expect(savedData).toEqual(secondParams);
    });

    it('日本語とUnicode文字が正しく保存・読み込みされる', async () => {
      const params: DefineIssueParams = {
        issue: '日本語課題 🎯',
        context: 'マークダウン**太字**と_斜体_、絵文字🚀',
        constraints: '制約：改行\nあり、特殊文字♪♫♪'
      };

      const result = await defineIssueHandler(params);
      expect(result.isError).toBe(false);

      // ファイルから直接読み込んで確認
      const fileContent = await fs.readFile(INTEGRATION_ISSUE_FILE, 'utf-8');
      const savedData = JSON.parse(fileContent);

      expect(savedData.issue).toBe('日本語課題 🎯');
      expect(savedData.context).toBe('マークダウン**太字**と_斜体_、絵文字🚀');
      expect(savedData.constraints).toBe('制約：改行\nあり、特殊文字♪♫♪');
    });
  });

  describe('権限エラーシナリオのテスト', () => {
    it('読み取り専用ファイルでの上書きエラーをテスト', async () => {
      // まず通常のファイルを作成
      const params: DefineIssueParams = {
        issue: '読み取り専用テスト',
        context: '読み取り専用ファイルテスト',
        constraints: '上書き不可'
      };

      const firstResult = await defineIssueHandler(params);
      expect(firstResult.isError).toBe(false);

      try {
        // ファイルを読み取り専用に設定（Unixライクシステムでのみ有効）
        if (process.platform !== 'win32') {
          await fs.chmod(INTEGRATION_ISSUE_FILE, 0o444);

          // 上書きを試行
          const secondParams: DefineIssueParams = {
            issue: '上書きテスト',
            context: '上書き試行',
            constraints: '読み取り専用ファイル'
          };

          const secondResult = await defineIssueHandler(secondParams);

          // Unix系では権限エラーが発生することを期待
          expect(secondResult.isError).toBe(true);
          const messages = secondResult.content.map(c => c.type === 'text' ? c.text : '').join(' ');
          expect(messages).toContain('権限');
        } else {
          // Windowsでは権限テストをスキップ
          console.log('Windows環境では権限テストをスキップします');
        }

      } finally {
        // ファイル権限を元に戻してクリーンアップ
        try {
          if (process.platform !== 'win32') {
            await fs.chmod(INTEGRATION_ISSUE_FILE, 0o644);
          }
        } catch {
          // 権限変更エラーは無視
        }
      }
    });

    it('ディスク容量不足エラーのシミュレート', async () => {
      // fs.writeFileをモックしてディスク容量不足をシミュレート
      const originalWriteFile = fs.writeFile;
      
      try {
        (fs as any).writeFile = async () => {
          const error = new Error('No space left on device') as NodeJS.ErrnoException;
          error.code = 'ENOSPC';
          throw error;
        };

        const params: DefineIssueParams = {
          issue: '容量テスト',
          context: 'ディスク容量不足テスト',
          constraints: 'ENOSPC エラー'
        };

        const result = await defineIssueHandler(params);

        expect(result.isError).toBe(true);
        const messages = result.content.map(c => c.type === 'text' ? c.text : '').join(' ');
        expect(messages).toContain('ディスク容量不足');

      } finally {
        // モックを元に戻す
        fs.writeFile = originalWriteFile;
      }
    });

    it('ファイルシステムエラーハンドリングの動作確認', async () => {
      // fs.mkdirをモックして権限エラーをシミュレート
      const originalMkdir = fs.mkdir;
      
      try {
        fs.mkdir = async () => {
          const error = new Error('Permission denied') as NodeJS.ErrnoException;
          error.code = 'EACCES';
          throw error;
        };

        const params: DefineIssueParams = {
          issue: '権限エラーテスト',
          context: '権限エラーシミュレーション',
          constraints: 'モックによるテスト'
        };

        const result = await defineIssueHandler(params);

        expect(result.isError).toBe(true);
        const messages = result.content.map(c => c.type === 'text' ? c.text : '').join(' ');
        expect(messages).toContain('権限エラー');

      } finally {
        fs.mkdir = originalMkdir;
      }
    });

    it('ファイル書き込み権限エラーのシミュレート', async () => {
      // fs.writeFileをモックして権限エラーをシミュレート
      const originalWriteFile = fs.writeFile;
      
      try {
        (fs as any).writeFile = async () => {
          const error = new Error('Permission denied') as NodeJS.ErrnoException;
          error.code = 'EACCES';
          throw error;
        };

        const params: DefineIssueParams = {
          issue: 'ファイル権限テスト',
          context: 'ファイル書き込み権限エラー',
          constraints: 'EACCES エラー'
        };

        const result = await defineIssueHandler(params);

        expect(result.isError).toBe(true);
        const messages = result.content.map(c => c.type === 'text' ? c.text : '').join(' ');
        expect(messages).toContain('権限エラー');

      } finally {
        fs.writeFile = originalWriteFile;
      }
    });

    it('複数の権限エラーパターンの統合テスト', async () => {
      const errorCases = [
        { code: 'EACCES', message: 'Permission denied', expectedText: '権限エラー' },
        { code: 'EPERM', message: 'Operation not permitted', expectedText: '権限エラー' },
        { code: 'ENOSPC', message: 'No space left on device', expectedText: 'ディスク容量不足' },
        { code: 'EROFS', message: 'Read-only file system', expectedText: 'ファイルシステムエラー' }
      ];

      for (const errorCase of errorCases) {
        const originalWriteFile = fs.writeFile;
        
        try {
          (fs as any).writeFile = async () => {
            const error = new Error(errorCase.message) as NodeJS.ErrnoException;
            error.code = errorCase.code as any;
            throw error;
          };

          const params: DefineIssueParams = {
            issue: `${errorCase.code}テスト`,
            context: `${errorCase.code}エラーシミュレーション`,
            constraints: `${errorCase.code}エラーケース`
          };

          const result = await defineIssueHandler(params);

          expect(result.isError).toBe(true);
          const messages = result.content.map(c => c.type === 'text' ? c.text : '').join(' ');
          expect(messages).toContain(errorCase.expectedText);

        } finally {
          fs.writeFile = originalWriteFile;
        }
      }
    });
  });

  describe('ファイルシステム状態の検証', () => {
    it('作成されたファイルのメタデータが正しい', async () => {
      const params: DefineIssueParams = {
        issue: 'メタデータテスト',
        context: 'ファイル属性確認',
        constraints: 'stat情報検証'
      };

      await defineIssueHandler(params);

      // ファイル統計情報を取得
      const stats = await fs.stat(INTEGRATION_ISSUE_FILE);

      // ファイルであることを確認
      expect(stats.isFile()).toBe(true);
      expect(stats.isDirectory()).toBe(false);

      // ファイルサイズが0より大きいことを確認
      expect(stats.size).toBeGreaterThan(0);

      // 作成時刻が現在時刻に近いことを確認（1分以内）
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - stats.mtime.getTime());
      expect(timeDiff).toBeLessThan(60000); // 1分 = 60000ms
    });

    it('ディレクトリ構造が正しく作成される', async () => {
      const params: DefineIssueParams = {
        issue: 'ディレクトリテスト',
        context: 'ディレクトリ構造確認',
        constraints: 'パス検証'
      };

      await defineIssueHandler(params);

      // データディレクトリが存在し、ディレクトリであることを確認
      const dirStats = await fs.stat(INTEGRATION_DATA_DIR);
      expect(dirStats.isDirectory()).toBe(true);

      // ファイルが正しいパスに作成されていることを確認
      const expectedPath = path.join(INTEGRATION_DATA_DIR, 'issue.json');
      expect(INTEGRATION_ISSUE_FILE).toBe(expectedPath);

      // ファイルが存在することを確認
      const fileStats = await fs.stat(INTEGRATION_ISSUE_FILE);
      expect(fileStats.isFile()).toBe(true);
    });

    it('同時実行時の競合状態をテスト', async () => {
      const params1: DefineIssueParams = {
        issue: '同時実行1',
        context: '競合テスト1',
        constraints: '並行処理1'
      };

      const params2: DefineIssueParams = {
        issue: '同時実行2',
        context: '競合テスト2',
        constraints: '並行処理2'
      };

      // 同時に実行
      const [result1, result2] = await Promise.all([
        defineIssueHandler(params1),
        defineIssueHandler(params2)
      ]);

      // 両方とも成功することを確認
      expect(result1.isError).toBe(false);
      expect(result2.isError).toBe(false);

      // ファイルが存在することを確認
      const fileExists = await fs.access(INTEGRATION_ISSUE_FILE).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // ファイル内容がいずれかのパラメータと一致することを確認
      const fileContent = await fs.readFile(INTEGRATION_ISSUE_FILE, 'utf-8');
      const savedData = JSON.parse(fileContent);
      
      const isParams1 = JSON.stringify(savedData) === JSON.stringify(params1);
      const isParams2 = JSON.stringify(savedData) === JSON.stringify(params2);
      
      expect(isParams1 || isParams2).toBe(true);
    });

    it('ファイルサイズと内容の整合性を検証', async () => {
      const params: DefineIssueParams = {
        issue: 'サイズテスト課題',
        context: 'ファイルサイズと内容の整合性を確認するためのテスト',
        constraints: 'JSON形式での保存とサイズ検証'
      };

      await defineIssueHandler(params);

      // ファイル統計情報を取得
      const stats = await fs.stat(INTEGRATION_ISSUE_FILE);
      
      // ファイル内容を読み込み
      const fileContent = await fs.readFile(INTEGRATION_ISSUE_FILE, 'utf-8');
      const savedData = JSON.parse(fileContent);

      // ファイルサイズが内容と一致することを確認
      expect(stats.size).toBe(Buffer.byteLength(fileContent, 'utf-8'));
      
      // 保存されたデータが正しいことを確認
      expect(savedData).toEqual(params);
      
      // JSONが適切にフォーマットされていることを確認
      expect(fileContent).toContain('{\n  "issue"');
    });

    it('ファイルの作成・更新タイムスタンプの検証', async () => {
      const params: DefineIssueParams = {
        issue: 'タイムスタンプテスト',
        context: 'ファイル作成・更新時刻の検証',
        constraints: 'mtime/ctimeの確認'
      };

      const beforeTime = new Date();
      await defineIssueHandler(params);
      const afterTime = new Date();

      const stats = await fs.stat(INTEGRATION_ISSUE_FILE);

      // 作成時刻が実行時刻の範囲内であることを確認
      expect(stats.mtime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime() - 1000);
      expect(stats.mtime.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000);

      // 少し待ってから更新
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updateParams: DefineIssueParams = {
        issue: '更新テスト',
        context: '更新時刻の検証',
        constraints: '上書き更新'
      };

      const updateBeforeTime = new Date();
      await defineIssueHandler(updateParams);
      const updateAfterTime = new Date();

      const updatedStats = await fs.stat(INTEGRATION_ISSUE_FILE);

      // 更新時刻が変更されていることを確認
      expect(updatedStats.mtime.getTime()).toBeGreaterThan(stats.mtime.getTime());
      expect(updatedStats.mtime.getTime()).toBeGreaterThanOrEqual(updateBeforeTime.getTime() - 1000);
      expect(updatedStats.mtime.getTime()).toBeLessThanOrEqual(updateAfterTime.getTime() + 1000);
    });

    it('ファイルエンコーディングの検証', async () => {
      const params: DefineIssueParams = {
        issue: 'エンコーディングテスト 🎯',
        context: '日本語とUnicode文字: こんにちは 🌸',
        constraints: '特殊文字: ♪♫♪ 改行\nテスト'
      };

      await defineIssueHandler(params);

      // バイナリモードでファイルを読み込み
      const buffer = await fs.readFile(INTEGRATION_ISSUE_FILE);
      
      // UTF-8エンコーディングであることを確認
      const utf8Content = buffer.toString('utf-8');
      const savedData = JSON.parse(utf8Content);

      expect(savedData.issue).toBe('エンコーディングテスト 🎯');
      expect(savedData.context).toBe('日本語とUnicode文字: こんにちは 🌸');
      expect(savedData.constraints).toBe('特殊文字: ♪♫♪ 改行\nテスト');

      // BOMが含まれていないことを確認
      expect(buffer[0]).not.toBe(0xEF);
      expect(buffer[1]).not.toBe(0xBB);
      expect(buffer[2]).not.toBe(0xBF);
    });

    it('ファイルの原子性操作の検証', async () => {
      // 大きなデータでの書き込みテスト
      const largeContext = 'A'.repeat(50); // 50文字の制限内で最大サイズ
      const largeConstraints = 'B'.repeat(50);
      
      const params: DefineIssueParams = {
        issue: '原子性テスト',
        context: largeContext,
        constraints: largeConstraints
      };

      const result = await defineIssueHandler(params);
      expect(result.isError).toBe(false);

      // ファイルが完全に書き込まれていることを確認
      const fileContent = await fs.readFile(INTEGRATION_ISSUE_FILE, 'utf-8');
      const savedData = JSON.parse(fileContent);
      
      expect(savedData.context).toBe(largeContext);
      expect(savedData.constraints).toBe(largeConstraints);
      expect(savedData.context.length).toBe(50);
      expect(savedData.constraints.length).toBe(50);
    });

    it('大量データでのパフォーマンステスト', async () => {
      // 制限内での最大サイズのデータを作成
      const maxIssue = 'A'.repeat(30);
      const maxContext = 'B'.repeat(60);
      const maxConstraints = 'C'.repeat(60);

      const params: DefineIssueParams = {
        issue: maxIssue,
        context: maxContext,
        constraints: maxConstraints
      };

      const startTime = Date.now();
      const result = await defineIssueHandler(params);
      const endTime = Date.now();

      expect(result.isError).toBe(false);

      // 処理時間が合理的な範囲内であることを確認（1秒以内）
      expect(endTime - startTime).toBeLessThan(1000);

      // データが正しく保存されていることを確認
      const fileContent = await fs.readFile(INTEGRATION_ISSUE_FILE, 'utf-8');
      const savedData = JSON.parse(fileContent);

      expect(savedData.issue).toBe(maxIssue);
      expect(savedData.context).toBe(maxContext);
      expect(savedData.constraints).toBe(maxConstraints);
    });
  });
});