# AcceptanceCriteria機能実装チェックリスト

## Phase 1: ドメイン語彙の作成
- [ ] `src/domain/term/task/acceptance_criterion.ts` を作成
  - [ ] AcceptanceCriterion型定義
  - [ ] constructAcceptanceCriterion関数実装
  - [ ] completeAcceptanceCriterion関数実装
  - [ ] バリデーション関数群の実装
  - [ ] エラー型定義（InvalidScenario等）

## Phase 2: PRTaskドメインの拡張
- [ ] `src/domain/term/task/pr_task.ts` を修正
  - [ ] RequestedPrTaskにacceptanceCriteriaフィールド追加
  - [ ] PrTaskにacceptanceCriteriaフィールド追加
  - [ ] constructPrTaskワークフローを拡張
  - [ ] createAcceptanceCriteriaFromParams関数実装
  - [ ] エラーハンドリングの追加

## Phase 3: WorkPlanドメインの拡張
- [ ] `src/domain/term/plan/work_plan.ts` を修正
  - [ ] RequestedWorkPlanのtasks配列にacceptanceCriteria追加
  - [ ] 既存のconstructWorkPlan関数が新フィールドを処理することを確認

## Phase 4: MCPスキーマの拡張
- [ ] `src/mcp/tool/plan/schema.ts` を修正
  - [ ] planToolZodSchemaのtasksスキーマにacceptanceCriteria追加
  - [ ] 必須フィールドとバリデーション規則の設定
- [ ] `src/mcp/tool/plan/handler.ts` を確認
  - [ ] PlanToolResponseの型定義にacceptanceCriteria追加

## Phase 5: 読み取りビューの拡張
- [ ] `src/domain/read/master_plan/types.ts` を修正
  - [ ] PlanViewのtask部分にacceptanceCriteria追加
- [ ] `src/domain/read/master_plan/projections.ts` を修正
  - [ ] planViewToResponseでAcceptanceCriteriaをマッピング

## ビルド・テスト
- [ ] `npm run lint` 実行
- [ ] `npm run typecheck` 実行
- [ ] `npm run build` 実行
- [ ] MCPツールで動作確認

## 完了基準
- [ ] 全てのTypeScriptコンパイルエラーが解消
- [ ] Lintエラーなし
- [ ] MCP plan toolでacceptanceCriteriaを含むPlanが作成可能
- [ ] 作成されたPlanが正しくストレージに保存される
- [ ] 読み取り時にacceptanceCriteriaが正しく表示される