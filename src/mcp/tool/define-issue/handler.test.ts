import { describe, it, expect } from 'vitest';
import { defineIssueHandler } from './handler.js';
import { DefineIssueParams } from './schema.js';

describe('defineIssueHandler', () => {



  describe('エラーハンドリング', () => {
    describe('バリデーションエラー', () => {
      it('課題が空文字の場合、適切なエラーメッセージが返される', async () => {
        const params = {
          issue: '',
          context: 'テストコンテキスト',
          constraints: 'テスト制約'
        };

        const result = await defineIssueHandler(params);

        expect(result.isError).toBe(true);
        const messages = result.content.map(c => c.type === 'text' ? c.text : '').join(' ');
        expect(messages).toContain('入力検証エラー');
        expect(messages).toContain('課題は必須');
      });

      it('課題が30文字を超える場合、適切なエラーメッセージが返される', async () => {
        const params = {
          issue: 'これは30文字を超える非常に長い課題名です。文字数制限をテストしています。',
          context: 'テストコンテキスト',
          constraints: 'テスト制約'
        };

        const result = await defineIssueHandler(params);

        expect(result.isError).toBe(true);
        const messages = result.content.map(c => c.type === 'text' ? c.text : '').join(' ');
        expect(messages).toContain('入力検証エラー');
        expect(messages).toContain('30文字以内');
      });

      it('コンテキストが60文字を超える場合、適切なエラーメッセージが返される', async () => {
        const params = {
          issue: 'テスト課題',
          context: 'これは60文字を超える非常に長いコンテキストです。文字数制限をテストしています。さらに長くしてみます。追加のテキストで確実に60文字を超えるようにします。',
          constraints: 'テスト制約'
        };

        const result = await defineIssueHandler(params);

        expect(result.isError).toBe(true);
        const messages = result.content.map(c => c.type === 'text' ? c.text : '').join(' ');
        expect(messages).toContain('入力検証エラー');
        expect(messages).toContain('60文字以内');
      });

      it('制約が60文字を超える場合、適切なエラーメッセージが返される', async () => {
        const params = {
          issue: 'テスト課題',
          context: 'テストコンテキスト',
          constraints: 'これは60文字を超える非常に長い制約です。文字数制限をテストしています。さらに長くしてみます。追加のテキストで確実に60文字を超えるようにします。'
        };

        const result = await defineIssueHandler(params);

        expect(result.isError).toBe(true);
        const messages = result.content.map(c => c.type === 'text' ? c.text : '').join(' ');
        expect(messages).toContain('入力検証エラー');
        expect(messages).toContain('60文字以内');
      });

      it('複数のバリデーションエラーが同時に発生した場合、すべてのエラーが報告される', async () => {
        const params = {
          issue: '',
          context: '',
          constraints: 'これは60文字を超える非常に長い制約です。文字数制限をテストしています。さらに長くしてみます。追加のテキストで確実に60文字を超えるようにします。'
        };

        const result = await defineIssueHandler(params);

        expect(result.isError).toBe(true);
        const messages = result.content.map(c => c.type === 'text' ? c.text : '').join(' ');
        expect(messages).toContain('入力検証エラー');
        expect(messages).toContain('課題は必須');
        expect(messages).toContain('コンテキストは必須');
        expect(messages).toContain('60文字以内');
      });
    });


  });

  describe('構造化レスポンス', () => {
    it('成功時にissueのみを含む構造化データが返される', async () => {
      const params: DefineIssueParams = {
        issue: 'テスト課題',
        context: 'テストコンテキスト',
        constraints: 'テスト制約'
      };

      const result = await defineIssueHandler(params);

      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(2);
      
      // 構造化データの確認
      const textContent = result.content.find(c => c.type === 'text');
      expect(textContent).toBeDefined();
      
      // 次のアクション指示が含まれていることを確認
      const messages = result.content.map(c => c.type === 'text' ? c.text : '').join(' ');
      expect(messages).toContain('Widen Options');
    });
  });
});