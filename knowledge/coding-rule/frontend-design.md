## 1. 基本原則 & ファイル設計

| ID      | ルール                                                                       |
| ------- | ------------------------------------------------------------------------- |
| **B01** | コンポーネントは **use client が既定**。 |
| **B03** | **ロジック共有はカスタムフック**から。HOC・Render Props はレガシー互換か高度制御が必要な場合のみ。               |
| **B04** | UI とデータ取得／状態管理を分離：Presentational+Container もしくは「UI + カスタムフック」構成を徹底。       |

---

## 2. データ取得・ミューテーション

| ID      | ルール                                                                                  |
| ------- | ------------------------------------------------------------------------------------ |
| **D01** | **Mutation はすべて Action** に統一。手動 `fetch()` + `useState` を禁止。                          |
| **D02** | フォームは `<form action={fn}>` + `useActionState` / `useFormStatus` で管理し、ローディングとエラーを自動化。 |
| **D03** | 楽観的 UI は `useOptimistic` を使い、Action 成功時の再同期を任せる。                                     |
| **D04** | 非同期遷移は **`useTransition`** に集約し、`startTransition()` の生呼び出しを避ける。                      |
| **D05** | 非 React 依存ロジックは `useEffectEvent` でラップし、依存配列の手動最適化を不要にする。                             |
| **D06** | グローバル・横断的データは Context + Provider。高頻度更新には Zustand / Jotai 等を検討。                       |

---

## 3. 状態管理パターン

| ID      | ルール                                                               |
| ------- | ----------------------------------------------------------------- |
| **S01** | 単純状態 → `useState`；複雑遷移 → `useReducer`（State Reducer パターン）。        |
| **S02** | 初期値／リセット要件がある UI では **State Initializer** を導入し、`reset()` API を用意。 |
| **S03** | Tabs・Select など密結合 UI は **Compound Component** + 内部 Context で設計。   |
| **S04** | フォームは **Controlled Components** とし、バリデーションロジックをフックに切り出す。          |

---

## 4. パフォーマンス最適化

| ID      | ルール                                                                        |
| ------- | -------------------------------------------------------------------------- |
| **P01** | **メモ化は React Compiler に委譲**。`memo` / `useMemo` / `useCallback` は警告が出た箇所のみ。 |
| **P02** | コンパイラ違反は ESLint `react-compiler` ルールで即修正。                                  |
| **P03** | 不可視 UI の保持には **Activity (旧 Offscreen)** を使用し、アンマウントによる状態損失を防ぐ。             |
| **P04** | 1000 行超のリストは必ず virtualization（例: `react-window`）。                          |
| **P05** | 条件付き UI は可読性優先：`if` → 三項演算子 → `&&` の順。非同期表示は `Suspense` + Fallback。        |

---

## 5. アセット & ドキュメント

| ID      | ルール                                                                   |
| ------- | --------------------------------------------------------------------- |
| **A01** | 画像・フォントは **ES `import`** で読み込み、React 19 の Asset Loading に委ねる。         |
| **A02** | `<title>`・`<meta>` 等の **Document Metadata はコンポーネント内で宣言**し、外部ライブラリは不要。 |

---

## 6. コーディング規約 & ツールチェーン

| ID      | ルール                                                                                                |
| ------- | -------------------------------------------------------------------------------------------------- |
| **C01** | TypeScript 5.5+ を `strict` + `noUncheckedIndexedAccess` で運用；型の穴は zod などで縮小。                        |
| **C02** | **新 JSX Transform** を必須とし、従来ランタイムをビルドエラー扱い。                                                        |
             |
| **C03** | ESLint は `plugin:react/recommended` + `react/no-unstable-context-value` など v19 追加ルールを `error` に設定。 |
| **C04** | ユニットテストは **React Testing Library**、E2E は Playwright。`react-test-renderer` は非推奨。                    |
| **C05** | すべての再利用コンポーネントに **`displayName`** を付与し、単一責任を守る。                                                    |
| **C06** | スタイリングは **Extensible Styles**（variant / size など最小 API）＋ Tailwind / CSS-in-JS との共存を前提。              |
| **C07** | 関数コンポーネント 100%。クラスはメンテナンス中のレガシーのみ許容。                                                               |

---

## 7. アクセシビリティ & i18n

| ID      | ルール                                                                       |
| ------- | ------------------------------------------------------------------------- |
| **I01** | `Suspense` の `fallback` は国際化対象：例 `<Spinner aria-label={t('loading')} />`。 |
| **I02** | Action 失敗メッセージは DOM に表示し、`aria-live="assertive"` を付与。                     |
| **I03** | ネイティブ要素優先。キーボードフォーカス順を E2E テストに含める。                                       |

---

## 8. パターン選択早見表 重要！！

| 要件           | 推奨パターン                    |
| ------------ | ------------------------- |
| ロジック再利用      | カスタムフック                   |
| グローバル低頻度更新   | Context + Provider        |
| グローバル高頻度更新   | 外部 Store (Zustand)        |
| 複雑な状態遷移      | State Reducer             |
| 初期値・リセットが重要  | State Initializer         |
| フォーム         | Controlled Components     |
| 密結合な複数 UI 要素 | Compound Component        |
| 高速化・重レンダ回避   | React Compiler + Activity |

---
