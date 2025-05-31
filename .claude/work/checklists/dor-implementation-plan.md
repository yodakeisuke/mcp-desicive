# DoR（Definition of Ready）機能追加 実装プラン

## 1. 要求まとめ
- **DoR表現**: `readonly string[]` - シンプルな文字列配列
- **状態管理**: なし（チェック機能不要）
- **ステータス連携**: なし
- **管理方法**: 各PRタスクで個別定義
- **編集機能**: 未実装（作成時定義のみ）
- **入力方法**: plan tool実行時に同時定義
- **識別子**: ID不要

## 2. 設計方針

### ドメイン設計アプローチ
- **core-brief**ルール適用：関数型プログラマ思考
- **語彙定義**: DoRを独立したドメイン語彙として定義
- **不変性**: readonly配列による状態保護
- **モナディック合成**: Result型によるエラーハンドリング

### アーキテクチャ階層
```
MCP Layer (schema.ts) 
    ↓
Domain Command Layer (work_plan.ts, pr_task.ts)
    ↓  
Domain Term Layer (definition_of_ready.ts)
    ↓
Domain Read Layer (types.ts)
```

## 3. 実装範囲

### 新規作成ファイル
- `src/domain/term/task/definition_of_ready.ts`
  - DoR語彙定義
  - バリデーション関数
  - エラー型定義

### 既存ファイル拡張
- `src/domain/term/task/pr_task.ts`
  - RequestedPrTaskにdefinitionOfReady追加
  - PrTaskにdefinitionOfReady追加
  - 構築ワークフローにDoRバリデーション組み込み

- `src/domain/term/plan/work_plan.ts`
  - RequestedWorkPlanのtasks配列拡張

- `src/mcp/tool/plan/schema.ts`
  - Zodスキーマ拡張
  - レスポンス型拡張

- `src/domain/read/master_plan/types.ts`
  - 読み取りビュー拡張

## 4. ビジネスルール

### バリデーション仕様
- **項目レベル**: 空文字禁止
- **配列レベル**: 空配列許可（DoRなしタスク対応）
- **重複**: 許可
- **必須性**: definitionOfReadyフィールド自体は必須

### エラーハンドリング戦略
- DoR固有エラー型定義
- PRTaskエラー型への統合
- モナディック合成による伝播

## 5. 実装順序

### Phase 1: ドメイン語彙層
- DefinitionOfReadyドメイン語彙作成
- バリデーション関数実装
- エラー型定義

### Phase 2: PRTaskドメイン拡張
- データ構造拡張
- 構築ワークフロー拡張
- バリデーション統合

### Phase 3: WorkPlanドメイン拡張
- RequestedWorkPlan拡張
- タスク作成プロセス拡張

### Phase 4: MCPインターフェース拡張
- Zodスキーマ拡張
- レスポンス型拡張
- 入出力マッピング

### Phase 5: 読み取りビュー拡張
- PlanView拡張
- レスポンス変換拡張

### Phase 6: 統合検証
- ビルド確認
- 型チェック確認

## 6. 技術考慮事項

### 関数型プログラミング原則
- **純粋関数**: バリデーション関数の副作用排除
- **不変性**: readonly修飾子による状態保護
- **合成可能性**: Result型によるエラーハンドリング合成

### ドメイン語彙実装
- 型レベルでのドメイン操作定義
- 実装詳細の抽象化
- テスト可能性の向上

### 既存アーキテクチャとの整合性
- 既存のPRTask構築パターンに準拠
- 既存のエラーハンドリングパターンに統合
- 既存のMCPスキーマパターンに従う

## 7. 将来拡張考慮
- DoR項目の更新機能（update tool実装時）
- DoRテンプレート機能（プロジェクト共通DoR）
- DoR完了状態管理（チェックリスト機能）