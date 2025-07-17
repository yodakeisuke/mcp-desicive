# Refinement Tool Implementation Plan

## 概要
既存planの特定taskに対してリファインメント操作を行うMCP toolの実装計画

## 実装タスク

### 1. Domain Layer - リファインメント操作の実装
**ファイル**: `src/domain/command/task/aggregate.ts`

#### 1.1 コマンド定義
```typescript
type RefineTaskCommand = {
  planId: PlanId;
  taskId: PrTaskId;
  updates: {
    title?: string;
    description?: string;
    acceptanceCriteria?: AcceptanceCriterion[];
    definitionOfReady?: string[];
    dependencies?: PrTaskId[];
    estimatedHours?: number;
  };
};
```

#### 1.2 イベント定義
```typescript
type TaskRefinedEvent = {
  type: 'TaskRefined';
  planId: PlanId;
  taskId: PrTaskId;
  previousStatus: PrTaskStatus;
  updates: RefineTaskCommand['updates'];
  refinedAt: Date;
};
```

#### 1.3 アグリゲート操作
```typescript
function refineTask(
  plan: Plan,
  command: RefineTaskCommand
): Result<TaskRefinedEvent, RefinementError>
```

### 2. MCP Tool Layer - Refinementツールの実装

#### 2.1 Schema定義
**ファイル**: `src/mcp/tool/refinement/schema.ts`
- Zod schemaによるパラメータ検証
- 入力/出力型定義

#### 2.2 Handler実装
**ファイル**: `src/mcp/tool/refinement/handler.ts`
- コマンド実行とイベント処理
- エラーハンドリング
- レスポンス組み立て

#### 2.3 Tool登録
**ファイル**: `src/mcp/tool/refinement/index.ts`
- MCP tool定義
- プロンプト定義

### 3. Server統合
**ファイル**: `src/mcp/Server.ts`
- refinementツールの登録

## 実装順序

1. Domain層のrefinement操作
2. MCP tool schema定義
3. MCP tool handler実装
4. MCP tool登録とプロンプト
5. Server.tsへの統合
6. テストとバリデーション

## 技術的考慮事項

### Status遷移
- 任意のstatusから`Refined`への遷移を許可
- 既存の`canTransition`メソッドで対応済み

### エラーハンドリング
- TaskNotFoundError
- ValidationError
- StorageError

### 圏論的性質
- **冪等性**: 同じ更新を複数回適用しても結果は同じ
- **合成可能性**: 複数の更新を順次適用可能