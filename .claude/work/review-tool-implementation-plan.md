# Review Tool 実装計画

## 概要

既存の PRTask のステータスを `Reviewed` に変更する MCP ツールの実装計画。

## ドメイン分析結果

### ステータス遷移ルール (src/domain/term/task/status.ts:37-47)
```typescript
const validTransitions: Record<string, string[]> = {
  'ToBeRefined': ['Refined'],
  'Refined': ['Implemented'], 
  'Implemented': ['Reviewed'],
  'Reviewed': ['QAPassed', 'Implemented'],
  'QAPassed': ['Merged'],
  'Blocked': ['Implemented', 'Reviewed'],
};
```

`Reviewed` への遷移可能状態:
- `Implemented` → `Reviewed` (通常のフロー)
- `Blocked` → `Reviewed` (ブロック解除後)
- 任意の非終端状態 → `Reviewed` (line 33-35: ToBeRefined/Refined は任意状態から遷移可能)

### 既存ツールパターン分析

#### 1. ディレクトリ構造
```
src/mcp/tool/{tool-name}/
├── index.ts     // ツール定義とエクスポート
├── schema.ts    // Zod スキーマと型定義
├── handler.ts   // ビジネスロジック実装 
└── prompt.ts    // 次のアクション提案
```

#### 2. Schema パターン (assign/schema.ts)
- Zod スキーマでリクエスト検証
- `taskId` 必須フィールド (z.string().min(1))
- レスポンス型定義
- ドメインオブジェクト → レスポンス変換関数

#### 3. Handler パターン (assign/handler.ts)
- `loadCurrentPlan()` で現在のプラン取得
- Task 存在確認
- ドメインロジック実行 (PrTask メソッド利用)
- `savePlan()` で永続化
- `toCallToolResult()` でレスポンス構築

## 実装タスク

### Task 1: Schema 実装
**ファイル**: `src/mcp/tool/review/schema.ts`

```typescript
// Request Schema
const reviewToolZodSchema = z.object({
  taskId: z.string().min(1).describe("Unique identifier of the task to review")
});

// Response Type
export type ReviewToolResponse = {
  taskId: string;
  previousStatus: string;
  currentStatus: string;
  task: {
    id: string;
    title: string;
    description: string;
    status: string;
    // ... 他の必要フィールド
  };
};
```

### Task 2: Handler 実装
**ファイル**: `src/mcp/tool/review/handler.ts`

**アルゴリズム**:
1. `loadCurrentPlan()` でプラン取得
2. `taskId` でタスク検索
3. 現在ステータスから `Reviewed` への遷移可能性検証
4. `PrTaskStatus.reviewed()` でステータス更新
5. プラン更新 & 永続化
6. レスポンス構築

**使用するドメインロジック**:
- `PrTaskStatus.canTransition(currentStatus, PrTaskStatus.reviewed())`
- 新しいタスクインスタンス生成 (immutable update)

### Task 3: Prompt 実装
**ファイル**: `src/mcp/tool/review/prompt.ts`

```typescript
export const nextAction = (taskTitle: string): string => 
  `Task "${taskTitle}" has been marked as reviewed. Consider running QA tests or proceeding to merge.`;
```

### Task 4: Index 実装
**ファイル**: `src/mcp/tool/review/index.ts`

MCP ツール定義とエントリーポイントのエクスポート。

### Task 5: Server 登録
**ファイル**: `src/mcp/Server.ts`

既存の `listTools()` と `callTool()` にレビューツールを追加。

## ドメイン制約

### 1. エラーハンドリング
- `neverthrow` Result 型使用必須
- Exception throw 禁止
- エラー型: `PlanNotFound | TaskNotFound | InvalidTransition | StorageError`

### 2. 不変性
- 既存オブジェクト変更禁止
- 新しいインスタンス生成による更新

### 3. 関数合成
- モナディック (.andThen) とアプリカティブ (.combine) 合成
- 命令的制御フロー (if/else) 最小化

## 技術仕様

### 依存関係
```typescript
import { PrTaskStatus } from '../../../domain/term/task/status.js';
import { loadCurrentPlan, savePlan } from '../../../effect/storage/planStorage.js';
import { toCallToolResult } from '../util.js';
```

### レスポンス形式
```json
{
  "taskId": "task-001",
  "previousStatus": "Implemented", 
  "currentStatus": "Reviewed",
  "task": {
    "id": "task-001",
    "title": "Implement user authentication",
    "status": "Reviewed",
    "dependencies": ["task-000"]
  }
}
```

## 実装順序

1. **schema.ts** - 型定義の基盤
2. **prompt.ts** - 単純なユーティリティ
3. **handler.ts** - メインロジック
4. **index.ts** - ツール定義
5. **Server.ts** - 統合

各段階でコンパイル確認を行い、段階的に実装を進める。