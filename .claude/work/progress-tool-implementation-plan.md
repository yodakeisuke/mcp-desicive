# Progress Tool 実装計画

## 概要
PRタスクの受け入れ基準チェック管理とステータス自動遷移を行うMCPツール

## アーキテクチャ分析

### ドメインモデル
1. **AcceptanceCriterion**
   - `id`: string - 一意識別子
   - `isCompleted`: boolean - 完了状態
   - `scenario`, `given`, `when`, `then` - BDD形式の基準内容

2. **PrTask**
   - `acceptanceCriteria`: readonly AcceptanceCriterion[] - 受け入れ基準の配列
   - `status`: PrTaskStatus - 現在のステータス

3. **PrTaskStatus**
   - 対象ステータス: `Refined`, `Implemented`, `Reviewed`
   - 自動遷移先: `Refined` ↔ `Implemented`

## 実装設計

### 1. 入力スキーマ (schema.ts)
```typescript
{
  taskId: string,
  criteriaUpdates: Array<{
    id: string,
    completed: boolean
  }>
}
```

### 2. 処理フロー (handler.ts)

#### 2.1 バリデーション
1. プラン存在確認
2. タスク存在確認
3. ステータス検証（Refined/Implemented/Reviewed のみ許可）
4. 受け入れ基準ID存在確認（全件一括検証）

#### 2.2 更新処理
1. 受け入れ基準の完了状態を更新
2. 全基準の完了状況を判定
3. 必要に応じてステータス遷移
   - 全完了 + Refined → Implemented
   - 一部未完了 + Implemented/Reviewed → Refined

#### 2.3 トランザクション
- 受け入れ基準更新とステータス遷移は原子的に実行
- 失敗時は全操作をロールバック

### 3. エラーハンドリング
- `PlanNotFound`: プランが存在しない
- `TaskNotFound`: タスクが存在しない
- `InvalidStatus`: 対象外ステータスからの操作
- `CriteriaNotFound`: 存在しない基準IDを指定
- `StorageError`: 保存時のエラー

### 4. レスポンス設計
```typescript
{
  nextAction: string,     // 次のアクション提案
  task: {
    id: string,
    title: string,
    status: string,
    acceptanceCriteria: Array<{
      id: string,
      scenario: string,
      isCompleted: boolean
    }>,
    progress: {
      completed: number,
      total: number,
      percentage: number
    }
  }
}
```

## 実装手順

1. **schema.ts**: Zodスキーマとレスポンス型定義
2. **handler.ts**: ビジネスロジック実装
   - プラン/タスク取得
   - 基準ID検証
   - 更新処理（immutableに実装）
   - ステータス遷移判定
   - プラン保存
3. **prompt.ts**: ツール説明文
4. **index.ts**: エクスポート

## 技術的注意点

1. **関数型プログラミング**
   - クラスは使用しない
   - neverthrowでエラーハンドリング
   - 副作用なし（イベント生成のみ）

2. **イミュータブル更新**
   - 既存オブジェクトを変更せず新規作成
   - スプレッド構文での更新

3. **既存パターンの踏襲**
   - refinement/review ハンドラーの実装パターンに従う
   - エラーハンドリングの一貫性

## テストシナリオ

1. 正常系
   - 一部基準をチェック（Refined維持）
   - 全基準をチェック（Refined→Implemented）
   - 一部基準をアンチェック（Implemented→Refined）

2. 異常系
   - 存在しないタスクID
   - 存在しない基準ID
   - 不正なステータスからの操作