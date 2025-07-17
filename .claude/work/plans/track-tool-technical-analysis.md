# Track Tool Technical Analysis

## 型システム設計詳細

### EnhancedPlanViewStats型定義
```typescript
// src/domain/read/master_plan/types.ts に追加
export type ParallelExecutionStats = {
  executableLines: number;
  unassignedLines: number;
  executableUnassignedLines: number;
};

export type EnhancedPlanViewStats = PlanViewStats & {
  parallelExecutionStats: ParallelExecutionStats;
};

export type TrackPlanView = Omit<PlanView, 'stats'> & {
  stats: EnhancedPlanViewStats;
};
```

### ステータス完了判定の型安全性
```typescript
// src/domain/term/task/status.ts に追加予定
export const StatusCompletionCheck = {
  isCompleted: (status: PrTaskStatus): boolean => {
    switch (status.type) {
      case 'QAPassed':
        return true;
      case 'ToBeRefined':
      case 'Refined':
      case 'Implemented':
      case 'Reviewed':
      case 'Blocked':
      case 'Abandoned':
        return false;
      default:
        throw new Error(`Unknown status: ${status.type satisfies never}`);
    }
  }
} as const;
```

## 算出ロジックの詳細実装

### 完了ライン判定の詳細
```typescript
// enhanced_projections.ts
const deriveCompletedLines = (lines: LineView[]): Set<LineId> => {
  return new Set(
    lines
      .filter(line => isLineCompleted(line))
      .map(line => line.id)
  );
};

const isLineCompleted = (line: LineView): boolean => {
  // 空のラインは完了と見なさない
  if (line.tasks.length === 0) return false;
  
  // すべてのタスクが完了ステータス
  return line.tasks.every(task => 
    StatusCompletionCheck.isCompleted(task.status)
  );
};
```

### 実行可能性の詳細判定
```typescript
const calculateParallelExecutionStats = (lines: LineView[]): ParallelExecutionStats => {
  const completedLines = deriveCompletedLines(lines);
  
  const executableLines = lines.filter(line => 
    isLineExecutable(line, completedLines)
  );
  
  const unassignedLines = lines.filter(line => 
    isLineUnassigned(line)
  );
  
  const executableUnassignedLines = executableLines.filter(line => 
    isLineUnassigned(line)
  );
  
  return {
    executableLines: executableLines.length,
    unassignedLines: unassignedLines.length,
    executableUnassignedLines: executableUnassignedLines.length
  };
};

const isLineExecutable = (line: LineView, completedLines: Set<LineId>): boolean => {
  // 完了済みラインは実行可能ではない（既に完了している）
  if (completedLines.has(line.id)) return false;
  
  // すべての依存関係が完了済み
  return line.dependencies.every(depId => completedLines.has(depId));
};

const isLineUnassigned = (line: LineView): boolean => {
  // 空のラインはアサインされていないと見なす
  if (line.tasks.length === 0) return true;
  
  // すべてのタスクがアサインされていない
  return line.tasks.every(task => !task.assignedWorktree);
};
```

## 既存コードとの統合パターン

### Projection層の拡張
```typescript
// src/domain/read/master_plan/enhanced_projections.ts
import { projections } from './projections.js';
import { LineView } from './types.js';
import { WorkPlan } from '../../term/plan/work_plan.js';

const enhancedStatsProjections = {
  calculateEnhancedStats: (plan: WorkPlan, lines: LineView[]): EnhancedPlanViewStats => {
    const baseStats = projections.calculateStats(plan, lines);
    const parallelExecutionStats = calculateParallelExecutionStats(lines);
    
    return {
      ...baseStats,
      parallelExecutionStats
    };
  }
} as const;

export const enhancedProjections = {
  ...projections,
  calculateEnhancedStats: enhancedStatsProjections.calculateEnhancedStats
} as const;
```

### Query層の拡張
```typescript
// src/domain/read/master_plan/enhanced_queries.ts
import { planViewQueries } from './queries.js';
import { enhancedProjections } from './enhanced_projections.js';
import { TrackPlanView } from './types.js';

const trackQueries = {
  fromPlan: (plan: WorkPlan): TrackPlanView => {
    const lines = enhancedProjections.deriveLines(plan);
    const enhancedStats = enhancedProjections.calculateEnhancedStats(plan, lines);
    
    return {
      plan,
      lines,
      stats: enhancedStats,
      lastUpdated: new Date()
    };
  }
} as const;

export const enhancedQueries = {
  ...planViewQueries,
  track: trackQueries
} as const;
```

## Handler実装パターン

### Track Handler設計
```typescript
// src/mcp/tool/track/handler.ts
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { planStorage } from '../../../effect/storage/planStorage.js';
import { enhancedQueries } from '../../../domain/read/master_plan/enhanced_queries.js';
import { toCallToolResult } from '../util.js';
import { trackPrompt } from './prompt.js';

export const trackHandler = (): Promise<CallToolResult> => {
  return planStorage.loadLatest()
    .map(plan => {
      if (!plan) {
        return toCallToolResult([
          'No plan found. Please create a plan first using the plan tool.'
        ], true);
      }
      
      const trackView = enhancedQueries.track.fromPlan(plan);
      
      return toCallToolResult([
        trackPrompt.nextAction,
        JSON.stringify(trackView, null, 2)
      ], false);
    })
    .mapErr(error => {
      return toCallToolResult([
        `Failed to load plan: ${error.message}`
      ], true);
    })
    .match(
      result => Promise.resolve(result),
      errorResult => Promise.resolve(errorResult)
    );
};
```

## テストケース設計

### 単体テスト例
```typescript
// テストシナリオ1: 基本的な並列実行統計
describe('calculateParallelExecutionStats', () => {
  it('should calculate correct executable lines when dependencies are met', () => {
    const lines: LineView[] = [
      {
        id: 'line1' as LineId,
        name: 'feature-a',
        branch: 'feature-a',
        tasks: [createCompletedTask()],
        dependencies: []
      },
      {
        id: 'line2' as LineId,
        name: 'feature-b', 
        branch: 'feature-b',
        tasks: [createRefinedTask()],
        dependencies: ['line1' as LineId]
      },
      {
        id: 'line3' as LineId,
        name: 'feature-c',
        branch: 'feature-c', 
        tasks: [createRefinedTask()],
        dependencies: ['line2' as LineId]
      }
    ];
    
    const stats = calculateParallelExecutionStats(lines);
    
    expect(stats.executableLines).toBe(1); // line2のみ実行可能
    expect(stats.unassignedLines).toBe(2); // line2, line3がアサインされていない
    expect(stats.executableUnassignedLines).toBe(1); // line2のみ
  });
});
```

### 境界値テスト
```typescript
describe('edge cases', () => {
  it('should handle empty lines correctly', () => {
    const stats = calculateParallelExecutionStats([]);
    expect(stats).toEqual({
      executableLines: 0,
      unassignedLines: 0, 
      executableUnassignedLines: 0
    });
  });
  
  it('should handle circular dependencies gracefully', () => {
    // 循環依存関係のテストケース
    // 実装時に検討が必要
  });
});
```

## パフォーマンス分析

### 計算量分析
- **ライン数**: n (通常 10-50)
- **依存関係チェック**: O(n²) 最悪ケース
- **タスク数チェック**: O(m) where m = 総タスク数
- **全体**: O(n² + m) 実用上問題なし

### メモリ使用量
- **completed lines Set**: O(n)
- **一時的な配列**: O(n)
- **総合**: 軽量

## エラーハンドリング戦略

### エラーカテゴリ
1. **プラン不存在**: Graceful degradation
2. **ライン導出失敗**: 空配列での継続
3. **統計計算失敗**: デフォルト値での継続

### 実装例
```typescript
const safeCalculateParallelExecutionStats = (lines: LineView[]): ParallelExecutionStats => {
  try {
    return calculateParallelExecutionStats(lines);
  } catch (error) {
    // ログ出力 + デフォルト値返却
    console.warn('Failed to calculate parallel execution stats:', error);
    return {
      executableLines: 0,
      unassignedLines: 0,
      executableUnassignedLines: 0
    };
  }
};
```

## 実装順序の詳細

### Step 1: Core Logic
1. `StatusCompletionCheck` の実装
2. `calculateParallelExecutionStats` の実装
3. 単体テスト作成

### Step 2: Domain Integration  
1. `enhanced_projections.ts` の作成
2. `enhanced_queries.ts` の作成
3. 型定義の追加

### Step 3: Tool Implementation
1. `track/handler.ts` の実装
2. `track/schema.ts` の実装  
3. `track/prompt.ts` の実装
4. ツール登録

### Step 4: Validation
1. E2Eテスト
2. パフォーマンステスト
3. エラーケーステスト