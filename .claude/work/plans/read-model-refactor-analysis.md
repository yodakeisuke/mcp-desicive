# Read Model Refactoring Analysis

## 現状分析

### ファイル構成
```
src/domain/read/master_plan/
├── types.ts                 # 型定義 (62行)
├── projections.ts           # 基本projection (202行)
├── enhanced_projections.ts  # 拡張projection (110行)
├── queries.ts               # 基本query (59行)
├── enhanced_queries.ts      # 拡張query (47行)
└── index.ts                 # エクスポート統合 (7行)
```

## 問題点の特定

### 1. 重複とコード散在
- **統計計算の重複**: `projections.ts`と`enhanced_projections.ts`で類似ロジック
- **クエリパターンの重複**: `fromPlan`, `fromEvents`が両方のqueriesファイルにある
- **Line判定ロジックの散在**: `isLineCompleted`, `isLineExecutable`などが1ファイルに集中

### 2. 責任の分散
- **projection層**: イベント→状態、ライン導出、統計計算が混在
- **query層**: 基本と拡張で分離されているが、ロジックが重複
- **型定義**: 基本型と拡張型が同一ファイルに混在

### 3. 依存関係の複雑化
- `enhanced_projections.ts` → `projections.ts` (継承パターン)
- `enhanced_queries.ts` → `queries.ts` + `enhanced_projections.ts`
- 循環的依存のリスク

### 4. 拡張性の問題
- 新しい統計追加時の変更範囲が広い
- ライン判定ロジックの再利用が困難
- 型安全性の担保が不十分

## 設計原則違反

### SOLID原則の観点
- **SRP違反**: `projections.ts`が複数の責任を持つ
- **OCP違反**: 新機能追加時に既存コードの変更が必要
- **DIP違反**: 具体的な実装への依存が多い

### ドメイン設計の観点
- **Ubiquitous Language**: ビジネス語彙とコード構造の不一致
- **Bounded Context**: 責任境界が不明確
- **Immutability**: 変更可能な状態操作が混在

## リファクタリング目標

### 1. 責任の明確化
- **Event Projection**: イベント→状態の変換のみ
- **Line Analysis**: ライン分析・判定ロジック
- **Statistics Calculation**: 統計計算の専門化
- **View Construction**: ビュー構築の統一

### 2. 拡張性の向上
- **Strategy Pattern**: 統計計算の戦略化
- **Composition**: 機能の組み合わせによる柔軟性
- **Type Safety**: より強固な型安全性

### 3. コード品質の向上
- **Pure Functions**: 副作用のない関数設計
- **Testability**: 単体テストの容易性
- **Readability**: 意図の明確性

## 提案するアーキテクチャ

### 新しいファイル構成
```
src/domain/read/master_plan/
├── types/
│   ├── core.ts              # 基本型定義
│   ├── stats.ts             # 統計関連型
│   └── views.ts             # ビュー型定義
├── projections/
│   ├── event.ts             # Event → State
│   ├── line.ts              # Line導出・分析
│   └── stats.ts             # 統計計算
├── queries/
│   ├── plan_view.ts         # 基本PlanViewクエリ
│   └── track_view.ts        # TrackViewクエリ
└── index.ts                 # 統一エクスポート
```

### 設計パターン
1. **Module Pattern**: 機能別モジュール分割
2. **Strategy Pattern**: 統計計算の戦略化
3. **Factory Pattern**: ビュー構築の統一
4. **Composition Root**: 依存関係の管理

## 実装ステップ

### Phase 1: 型定義の整理
1. コア型の分離・整理
2. 統計型の専門化
3. ビュー型の統一

### Phase 2: Projection層の分割
1. Event projection専門化
2. Line analysis分離
3. Statistics calculation統一

### Phase 3: Query層の統合
1. 共通パターンの抽出
2. ファクトリー関数の導入
3. 型安全性の強化

### Phase 4: 統合・検証
1. 依存関係の更新
2. テストの実行
3. パフォーマンス検証

## 期待される効果

### 開発効率
- **新機能追加**: 影響範囲の局所化
- **テスト**: 単体テストの容易性向上
- **デバッグ**: 責任範囲の明確化

### コード品質
- **可読性**: 意図の明確化
- **保守性**: 変更の局所化
- **拡張性**: 新要件への対応力

### 型安全性
- **コンパイル時検証**: より強固な型チェック
- **リファクタリング安全性**: 変更の影響範囲把握
- **API一貫性**: 統一されたインターフェース