import { z } from 'zod';

/**
 * ワークフロー状態のADT（代数的データ型）
 */
export type WorkflowState =
  | { type: 'undefined' }
  | { type: 'issue_defined' }
  | { type: 'initial_options_registered' }
  | { type: 'laddered' }
  | { type: 'analogical_research_done' }
  | { type: 'elimination_tested' }
  | { type: 'options_fixed' };

/**
 * ワークフロー状態のコンストラクタ
 */
export const WorkflowState = {
  undefined: (): WorkflowState => ({ type: 'undefined' }),
  issueDefined: (): WorkflowState => ({ type: 'issue_defined' }),
  initialOptionsRegistered: (): WorkflowState => ({ type: 'initial_options_registered' }),
  laddered: (): WorkflowState => ({ type: 'laddered' }),
  analogicalResearchDone: (): WorkflowState => ({ type: 'analogical_research_done' }),
  eliminationTested: (): WorkflowState => ({ type: 'elimination_tested' }),
  optionsFixed: (): WorkflowState => ({ type: 'options_fixed' }),
} as const;

/**
 * Zodスキーマ
 */
export const WorkflowStateSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('undefined') }),
  z.object({ type: z.literal('issue_defined') }),
  z.object({ type: z.literal('initial_options_registered') }),
  z.object({ type: z.literal('laddered') }),
  z.object({ type: z.literal('analogical_research_done') }),
  z.object({ type: z.literal('elimination_tested') }),
  z.object({ type: z.literal('options_fixed') }),
]);

/**
 * 状態遷移ルールの定義
 * 注意: issue_definedへの遷移は別途isValidTransitionで常に許可される
 */
const getValidTransitions = (state: WorkflowState): WorkflowState['type'][] => {
  switch (state.type) {
    case 'undefined':
      return ['issue_defined'];
    case 'issue_defined':
      return ['initial_options_registered'];
    case 'initial_options_registered':
      return ['laddered', 'analogical_research_done', 'elimination_tested'];
    case 'laddered':
      return ['analogical_research_done', 'elimination_tested', 'initial_options_registered'];
    case 'analogical_research_done':
      return ['elimination_tested', 'options_fixed', 'initial_options_registered'];
    case 'elimination_tested':
      return ['options_fixed', 'initial_options_registered', 'analogical_research_done'];
    case 'options_fixed':
      return [];
  }
};

/**
 * 状態遷移が有効かどうかを判定する純粋関数
 */
export const isValidTransition = (from: WorkflowState, to: WorkflowState): boolean => {
  // define_issue: どの状態からも課題定義済みに遷移可能
  if (to.type === 'issue_defined') {
    return true;
  }
  
  // 同じ状態への遷移は常に許可（上書き）
  if (from.type === to.type) {
    return true;
  }
  
  const validTransitions = getValidTransitions(from);
  return validTransitions.includes(to.type);
};

/**
 * 状態の表示名を取得する純粋関数
 */
export const getDisplayName = (state: WorkflowState): string => {
  switch (state.type) {
    case 'undefined':
      return '未定義状態';
    case 'issue_defined':
      return '課題定義済み';
    case 'initial_options_registered':
      return '初期選択肢登録済み';
    case 'laddered':
      return 'ラダリング済み';
    case 'analogical_research_done':
      return '類推による類似問題調査済み';
    case 'elimination_tested':
      return '消去テスト済み';
    case 'options_fixed':
      return '選択肢fixed';
  }
};

/**
 * 状態を比較する純粋関数
 */
export const isState = (state: WorkflowState, type: WorkflowState['type']): boolean =>
  state.type === type;