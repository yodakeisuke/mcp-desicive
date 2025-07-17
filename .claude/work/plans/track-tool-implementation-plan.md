# Track Tool Implementation Plan

## 概要

**目的**: 現在のplan全体の状況把握とモニタリングを行うread-onlyツール
**ツール名**: `track`
**パラメーター**: なし（全体状況の一括取得）

## アーキテクチャ設計

### 1. 既存システムとの関係
- **ベース**: 既存のplan toolの読み取り機能を活用
- **差分**: 並行実行統計情報の追加
- **共通部分**: PlanView構造、クエリシステム

### 2. レスポンス構造
```typescript
type TrackResponse = {
  plan: WorkPlan;
  lines: LineView[];
  stats: EnhancedPlanViewStats;  // 拡張版
  lastUpdated: Date;
};

type EnhancedPlanViewStats = PlanViewStats & {
  parallelExecutionStats: {
    executableLines: number;        // 依存関係を満たして実行可能
    unassignedLines: number;        // アサインされていない
    executableUnassignedLines: number;  // 両方を満たす
  };
};
```

## 核心ロジック設計

### 1. 並列実行可能ライン数の正確な算出

#### 現在の実装の問題
- **現在**: `line.dependencies.length === 0` (依存関係なし)
- **問題**: 依存関係があっても、依存先が完了していれば実行可能

#### 新しい算出ロジック
```typescript
const calculateExecutableLines = (lines: LineView[]): number => {
  const completedLines = getCompletedLines(lines);
  
  return lines.filter(line => {
    // すべての依存関係が完了済みライン集合に含まれているかチェック
    return line.dependencies.every(depId => 
      completedLines.has(depId)
    );
  }).length;
};

const getCompletedLines = (lines: LineView[]): Set<LineId> => {
  return new Set(
    lines
      .filter(line => 
        line.tasks.every(task => 
          isCompletedStatus(task.status)
        )
      )
      .map(line => line.id)
  );
};

const isCompletedStatus = (status: PrTaskStatus): boolean => {
  return status.type === 'QAPassed';
};
```

### 2. アサインされていないライン数の算出

#### 判定条件
- **定義**: ライン内の**全タスク**がアサインされていない
- **条件**: `PrTask.assignedWorktree`がnull/undefined

#### 実装ロジック
```typescript
const calculateUnassignedLines = (lines: LineView[]): number => {
  return lines.filter(line => 
    line.tasks.every(task => 
      !task.assignedWorktree
    )
  ).length;
};
```

### 3. 実行可能でかつアサインされていないライン数
```typescript
const calculateExecutableUnassignedLines = (
  lines: LineView[]
): number => {
  const completedLines = getCompletedLines(lines);
  
  return lines.filter(line => {
    const isExecutable = line.dependencies.every(depId => 
      completedLines.has(depId)
    );
    const isUnassigned = line.tasks.every(task => 
      !task.assignedWorktree
    );
    
    return isExecutable && isUnassigned;
  }).length;
};
```

## 実装ファイル構成

### ディレクトリ構造
```
src/mcp/tool/track/
├── index.ts         # Tool registration
├── handler.ts       # Main logic
├── schema.ts        # Zod validation + response transformation
└── prompt.ts        # Next action instructions
```

### 新規実装ファイル
1. **Enhanced Stats Calculation**: `src/domain/read/master_plan/enhanced_projections.ts`
2. **Track Tool Handler**: `src/mcp/tool/track/handler.ts`
3. **Track Tool Schema**: `src/mcp/tool/track/schema.ts`

## 段階的実装計画

### Phase 1: Enhanced Statistics計算機能
- [ ] `enhanced_projections.ts`の作成
- [ ] 並列実行可能ライン数算出ロジック実装
- [ ] アサインされていないライン数算出ロジック実装
- [ ] 単体テスト実装

### Phase 2: Track Tool Infrastructure
- [ ] `track/handler.ts`の実装（read-only）
- [ ] `track/schema.ts`のレスポンス変換実装
- [ ] `track/prompt.ts`の作成
- [ ] `track/index.ts`のツール登録

### Phase 3: Integration & Testing
- [ ] MCP Server統合
- [ ] End-to-endテスト
- [ ] パフォーマンス検証

## 技術詳細

### 依存関係
- **既存**: `domain/read/master_plan/*`
- **新規**: enhanced_projections.ts
- **エラーハンドリング**: neverthrowパターン継続

### パフォーマンス考慮
- ライン数は通常10-50程度と想定
- O(n²)の依存関係チェックは許容範囲
- 必要に応じてメモ化実装

### エラー境界
- プランが存在しない場合のハンドリング
- ライン導出失敗時の対応
- 統計計算エラーの伝播

## 検証計画

### 単体テスト
1. **Enhanced Statistics**
   - 依存関係完了判定テスト
   - アサイン状態判定テスト
   - 複合条件テスト

2. **Track Tool Handler**
   - 正常系レスポンステスト
   - エラー系ハンドリングテスト

### 統合テスト
1. **MCP Tool Registration**
2. **E2E Response Format**
3. **Performance under Load**

## リスク分析

### 技術リスク
- **低**: 既存アーキテクチャの拡張のため
- **依存関係**: plan toolとの設計整合性

### 運用リスク
- **低**: read-onlyツールのため副作用なし
- **モニタリング**: レスポンス時間の監視必要

## 完了条件

1. [ ] すべての要求仕様を満たすtrack toolが動作
2. [ ] 並列実行統計情報が正確に算出される
3. [ ] 既存のplan toolとの一貫性が保たれる
4. [ ] lint, typecheck, buildが成功する

## 実装予定時間

- **Phase 1**: 2-3時間
- **Phase 2**: 1-2時間  
- **Phase 3**: 1時間
- **総計**: 4-6時間