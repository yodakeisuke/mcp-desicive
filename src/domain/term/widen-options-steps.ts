import { z } from 'zod';

/**
 * WidenOptionsSteps - 選択肢の幅を広げるためのステップ定義
 * 語彙「WidenOptionsSteps」
 * domain type: value
 */
export type WidenOptionsSteps =
  | { type: 'initial_registered'; description: '初期登録した' }
  | { type: 'laddered'; description: 'ラダリングした' }
  | { type: 'analogical_research_done'; description: '類推解決策調査した' }
  | { type: 'elimination_tested'; description: '消去テストした' }
  | { type: 'fixed'; description: 'fixした' };

/**
 * WidenOptionsStepsのコンストラクタ
 */
export const WidenOptionsSteps = {
  initialRegistered: (): WidenOptionsSteps => ({ type: 'initial_registered', description: '初期登録した' }),
  laddered: (): WidenOptionsSteps => ({ type: 'laddered', description: 'ラダリングした' }),
  analogicalResearchDone: (): WidenOptionsSteps => ({ type: 'analogical_research_done', description: '類推解決策調査した' }),
  eliminationTested: (): WidenOptionsSteps => ({ type: 'elimination_tested', description: '消去テストした' }),
  fixed: (): WidenOptionsSteps => ({ type: 'fixed', description: 'fixした' }),
} as const;

/**
 * Zodスキーマ
 */
export const WidenOptionsStepsSchema = z.discriminatedUnion('type', [
  z.object({ 
    type: z.literal('initial_registered'), 
    description: z.literal('初期登録した') 
  }),
  z.object({ 
    type: z.literal('laddered'), 
    description: z.literal('ラダリングした') 
  }),
  z.object({ 
    type: z.literal('analogical_research_done'), 
    description: z.literal('類推解決策調査した') 
  }),
  z.object({ 
    type: z.literal('elimination_tested'), 
    description: z.literal('消去テストした') 
  }),
  z.object({ 
    type: z.literal('fixed'), 
    description: z.literal('fixした') 
  }),
]);

/**
 * WorkflowStateからWidenOptionsStepsへのマッピング
 */
export const fromWorkflowState = (workflowState: { type: string }): WidenOptionsSteps | null => {
  switch (workflowState.type) {
    case 'initial_options_registered':
      return WidenOptionsSteps.initialRegistered();
    case 'laddered':
      return WidenOptionsSteps.laddered();
    case 'analogical_research_done':
      return WidenOptionsSteps.analogicalResearchDone();
    case 'elimination_tested':
      return WidenOptionsSteps.eliminationTested();
    case 'options_fixed':
      return WidenOptionsSteps.fixed();
    default:
      return null;
  }
};

/**
 * WidenOptionsStepsからWorkflowStateのtypeへのマッピング
 */
export const toWorkflowStateType = (step: WidenOptionsSteps): string => {
  switch (step.type) {
    case 'initial_registered':
      return 'initial_options_registered';
    case 'laddered':
      return 'laddered';
    case 'analogical_research_done':
      return 'analogical_research_done';
    case 'elimination_tested':
      return 'elimination_tested';
    case 'fixed':
      return 'options_fixed';
  }
};

/**
 * ステップの表示名を取得する純粋関数
 */
export const getStepDisplayName = (step: WidenOptionsSteps): string => step.description;

/**
 * すべてのステップを順序通りに取得
 */
export const getAllSteps = (): WidenOptionsSteps[] => [
  WidenOptionsSteps.initialRegistered(),
  WidenOptionsSteps.laddered(),
  WidenOptionsSteps.analogicalResearchDone(),
  WidenOptionsSteps.eliminationTested(),
  WidenOptionsSteps.fixed(),
];

/**
 * ステップを比較する純粋関数
 */
export const isStep = (step: WidenOptionsSteps, type: WidenOptionsSteps['type']): boolean =>
  step.type === type;