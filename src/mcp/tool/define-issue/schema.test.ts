import { describe, it, expect } from 'vitest';
import { defineIssueSchema, defineIssueOutputSchema, type DefineIssueParams, type DefineIssueResponse } from './schema';

describe('defineIssueSchema', () => {
  describe('正常系', () => {
    it('有効な入力データを正常に検証する', () => {
      const validInput = {
        issue: '新機能の優先順位決定',
        context: 'リソースが限られている中で、ユーザー価値と技術的実現可能性を両立する必要がある',
        constraints: '開発期間: 3ヶ月以内、予算: 500万円以下、チーム規模: 5名'
      };

      const result = defineIssueSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.issue).toBe(validInput.issue);
        expect(result.data.context).toBe(validInput.context);
        expect(result.data.constraints).toBe(validInput.constraints);
      }
    });

    it('境界値（最大文字数）で正常に検証する', () => {
      const boundaryInput = {
        issue: 'a'.repeat(30), // 30文字ちょうど
        context: 'b'.repeat(60), // 60文字ちょうど
        constraints: 'c'.repeat(60) // 60文字ちょうど
      };

      const result = defineIssueSchema.safeParse(boundaryInput);
      expect(result.success).toBe(true);
    });
  });

  describe('異常系', () => {
    it('issueが空文字の場合、バリデーションエラーが発生する', () => {
      const invalidInput = {
        issue: '',
        context: 'コンテキスト',
        constraints: '制約'
      };

      const result = defineIssueSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('課題は必須です');
      }
    });

    it('issueが30文字を超える場合、バリデーションエラーが発生する', () => {
      const invalidInput = {
        issue: 'a'.repeat(31), // 31文字
        context: 'コンテキスト',
        constraints: '制約'
      };

      const result = defineIssueSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('課題は30文字以内で入力してください');
      }
    });

    it('contextが空文字の場合、バリデーションエラーが発生する', () => {
      const invalidInput = {
        issue: '課題',
        context: '',
        constraints: '制約'
      };

      const result = defineIssueSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('コンテキストは必須です');
      }
    });

    it('contextが60文字を超える場合、バリデーションエラーが発生する', () => {
      const invalidInput = {
        issue: '課題',
        context: 'a'.repeat(61), // 61文字
        constraints: '制約'
      };

      const result = defineIssueSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('コンテキストは60文字以内で入力してください');
      }
    });

    it('constraintsが空文字の場合、バリデーションエラーが発生する', () => {
      const invalidInput = {
        issue: '課題',
        context: 'コンテキスト',
        constraints: ''
      };

      const result = defineIssueSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('制約は必須です');
      }
    });

    it('constraintsが60文字を超える場合、バリデーションエラーが発生する', () => {
      const invalidInput = {
        issue: '課題',
        context: 'コンテキスト',
        constraints: 'a'.repeat(61) // 61文字
      };

      const result = defineIssueSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('制約は60文字以内で入力してください');
      }
    });

    it('必須フィールドが欠けている場合、バリデーションエラーが発生する', () => {
      const invalidInput = {
        issue: '課題'
        // context と constraints が欠けている
      };

      const result = defineIssueSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('defineIssueOutputSchema', () => {
  it('有効な出力データを正常に検証する', () => {
    const validOutput = {
      issue: '新機能の優先順位決定'
    };

    const result = defineIssueOutputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
    
    if (result.success) {
      expect(result.data.issue).toBe(validOutput.issue);
    }
  });

  it('issueフィールドが欠けている場合、バリデーションエラーが発生する', () => {
    const invalidOutput = {};

    const result = defineIssueOutputSchema.safeParse(invalidOutput);
    expect(result.success).toBe(false);
  });
});

describe('型定義', () => {
  it('DefineIssueParams型が正しく推論される', () => {
    const params: DefineIssueParams = {
      issue: '課題',
      context: 'コンテキスト',
      constraints: '制約'
    };

    expect(typeof params.issue).toBe('string');
    expect(typeof params.context).toBe('string');
    expect(typeof params.constraints).toBe('string');
  });

  it('DefineIssueResponse型が正しく推論される', () => {
    const response: DefineIssueResponse = {
      issue: '課題'
    };

    expect(typeof response.issue).toBe('string');
  });
});