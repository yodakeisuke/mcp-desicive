# AcceptanceCriteria機能 詳細設計書

## 1. ドメインモデル設計

### AcceptanceCriterion (値オブジェクト)
```typescript
// src/domain/term/task/acceptance_criterion.ts

export type AcceptanceCriterion = {
  readonly id: string;
  readonly scenario: string;
  readonly given: readonly string[];
  readonly when: readonly string[];
  readonly then: readonly string[];
  readonly isCompleted: boolean;
  readonly createdAt: Date;
};

export type RequestedAcceptanceCriterion = {
  readonly scenario: string;
  readonly given: readonly string[];
  readonly when: readonly string[];
  readonly then: readonly string[];
};

export type AcceptanceCriterionError = 
  | { type: 'InvalidScenario'; message: string }
  | { type: 'EmptyGiven'; message: string }
  | { type: 'EmptyWhen'; message: string }
  | { type: 'EmptyThen'; message: string }
  | { type: 'InvalidArrayElement'; field: string; message: string };
```

### 関数シグネチャ
```typescript
// バリデーション
export const validateScenario: (scenario: string) => Result<string, AcceptanceCriterionError>;
export const validateSteps: (steps: readonly string[], field: 'given' | 'when' | 'then') => Result<readonly string[], AcceptanceCriterionError>;

// コンストラクタ
export const constructAcceptanceCriterion: (params: RequestedAcceptanceCriterion) => Result<AcceptanceCriterion, AcceptanceCriterionError[]>;

// 状態更新
export const completeAcceptanceCriterion: (criterion: AcceptanceCriterion) => AcceptanceCriterion;
export const uncompleteAcceptanceCriterion: (criterion: AcceptanceCriterion) => AcceptanceCriterion;
```

## 2. PRTask拡張設計

### 型定義の変更
```typescript
// RequestedPrTaskに追加
export type RequestedPrTask = {
  // ... existing fields
  readonly acceptanceCriteria: ReadonlyArray<{
    readonly scenario: string;
    readonly given: readonly string[];
    readonly when: readonly string[];
    readonly then: readonly string[];
  }>;
};

// PrTaskに追加
export type PrTask = {
  // ... existing fields
  readonly acceptanceCriteria: readonly AcceptanceCriterion[];
};
```

### constructPrTaskワークフローの変更
```typescript
// 新規追加関数
const createAcceptanceCriteriaFromParams: (
  criteriaParams: ReadonlyArray<RequestedAcceptanceCriterion>
) => Result<readonly AcceptanceCriterion[], Error[]>;

// 既存ワークフローに組み込み
export const constructPrTask = (params: RequestedPrTask): Result<PrTask, Error[]> =>
  validatePrTaskParams(params)
    .andThen(validParams => 
      createAcceptanceCriteriaFromParams(validParams.acceptanceCriteria)
        .andThen(criteria => 
          createPrTask({
            ...validParams,
            acceptanceCriteria: criteria
          })
        )
    );
```

## 3. API スキーマ設計

### Zodスキーマ
```typescript
// src/mcp/tool/plan/schema.ts
const acceptanceCriterionSchema = z.object({
  scenario: z.string().min(1, "Scenario cannot be empty"),
  given: z.array(z.string().min(1, "Given step cannot be empty"))
    .min(1, "At least one Given step is required"),
  when: z.array(z.string().min(1, "When step cannot be empty"))
    .min(1, "At least one When step is required"),
  then: z.array(z.string().min(1, "Then step cannot be empty"))
    .min(1, "At least one Then step is required")
});

// planToolZodSchemaの拡張
tasks: z.array(z.object({
  // ... existing fields
  acceptanceCriteria: z.array(acceptanceCriterionSchema)
    .min(1, "At least one acceptance criterion is required")
    .describe("Acceptance criteria in Given-When-Then format")
}))
```

### レスポンス型
```typescript
// PlanToolResponseに追加
tasks: Array<{
  // ... existing fields
  acceptanceCriteria: Array<{
    id: string;
    scenario: string;
    given: string[];
    when: string[];
    then: string[];
    isCompleted: boolean;
    createdAt: string; // ISO 8601
  }>;
}>;
```

## 4. 実装順序と依存関係

### 実装順序
1. acceptance_criterion.ts (独立モジュール)
2. pr_task.ts (acceptance_criterionに依存)
3. work_plan.ts (pr_taskに依存)
4. schema.ts (ドメインモデルに依存)
5. types.ts, projections.ts (全体に依存)

### パッケージ依存
```json
// package.jsonに追加済み
"uuid": "^11.0.6"
```

## 5. エラーハンドリング方針

### ドメイン層
- neverthrowのResult型で全エラーを表現
- エラーの集約はArray<Error>形式
- 早期リターンではなく、全バリデーションエラーを収集

### API層
- Zodバリデーションエラーはドメインエラーに変換
- ドメインエラーはMCPエラーレスポンスに変換

## 6. テストシナリオ

### 正常系
1. 1つのAcceptanceCriterionを持つPrTask作成
2. 複数のAcceptanceCriteriaを持つPrTask作成
3. 複数のgiven/when/thenステップを持つcriterion作成

### 異常系
1. 空のscenarioでエラー
2. 空配列のgiven/when/thenでエラー
3. 空文字列を含むステップ配列でエラー
4. acceptanceCriteria配列が空でエラー

## 7. 将来の拡張ポイント

### 完了状態管理
- 各criterionの個別完了管理API
- PrTaskの自動完了判定ロジック
- 完了状態の永続化とイベント発行

### UI連携
- criterion完了チェックリストUI
- Given-When-Thenエディタ
- 進捗可視化ダッシュボード