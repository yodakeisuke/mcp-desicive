import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { OptionSelectionAggregate } from '../../../domain/command/option-selection.js';
import { Values } from '../../../domain/term/option.js';
import { saveOptions } from '../../../effect/options-storage.js';
import { toStructuredCallToolResult, toCallToolResult } from '../util.js';
import { SUCCESS_MESSAGE_TEMPLATE, ERROR_MESSAGE_PREFIX, NEXT_ACTION_PROMPTS, processTemplate } from './prompt.js';
import type { RegisterOptionsParams, RegisterOptionsResponse } from './schema.js';
import { WorkflowState } from '../../../domain/term/workflow-state.js';
import { updateState } from '../../../effect/workflow-state-storage.js';
import { toWorkflowStateType } from '../../../domain/term/widen-options-steps.js';

export const registerOptionsHandler = async (args: RegisterOptionsParams): Promise<CallToolResult> => {
  const result = OptionSelectionAggregate.registerOptions({
    options: args.options
  });

  return result.match(
    async (event) => {
      // Save options to storage
      const saveResult = await saveOptions(event.optionList);
      
      if (saveResult.isErr()) {
        return toCallToolResult([`${ERROR_MESSAGE_PREFIX}選択肢の保存に失敗しました: ${saveResult.error.message}`], true);
      }

      // 選択肢登録が成功したら状態を遷移（入力されたWidenOptionsStepに基づく）
      const targetStep = args.widenOptionsStep;
      const targetStateType = toWorkflowStateType(targetStep);
      
      let targetState: WorkflowState;
      switch (targetStateType) {
        case 'initial_options_registered':
          targetState = WorkflowState.initialOptionsRegistered();
          break;
        case 'laddered':
          targetState = WorkflowState.laddered();
          break;
        case 'analogical_research_done':
          targetState = WorkflowState.analogicalResearchDone();
          break;
        case 'elimination_tested':
          targetState = WorkflowState.eliminationTested();
          break;
        case 'options_fixed':
          targetState = WorkflowState.optionsFixed();
          break;
        default:
          // 予期しない状態タイプの場合はエラーを返す
          return toCallToolResult([`${ERROR_MESSAGE_PREFIX}予期しないWidenOptionsSteps: ${targetStep.type}`], true);
      }
      
      const stateResult = await updateState(targetState);
      
      if (stateResult.isErr()) {
        const stateError = stateResult.error;
        let message: string;
        
        switch (stateError.type) {
          case 'invalid_transition':
            message = `状態遷移エラー: ${stateError.from.type} から ${stateError.to.type} への遷移は無効です`;
            break;
          case 'file_system_error':
            message = `ファイルシステムエラー: ${stateError.error.message}`;
            break;
          case 'parse_error':
            message = `データ解析エラー: ${stateError.message}`;
            break;
          default:
            message = `状態管理エラー: 予期しないエラーが発生しました`;
        }
        
        return toCallToolResult([`${ERROR_MESSAGE_PREFIX}${message}`], true);
      }

      const options = event.optionList.options.map(option => ({
        id: Values.OptionId.toString(option.id),
        text: Values.OptionText.toString(option.text)
      }));

      // 入力されたWidenOptionsStepを使用
      const widenOptionsStep = args.widenOptionsStep;

      const response: RegisterOptionsResponse = {
        options,
        widenOptionsStep
      };

      const optionsList = options
        .map((opt, idx) => `${idx + 1}. ${opt.text}`)
        .join('\n');

      const successMessage = processTemplate(SUCCESS_MESSAGE_TEMPLATE, {
        count: options.length,
        optionsList: optionsList
      });

      // WidenOptionsStepに基づく次のアクションプロンプトを取得
      const nextActionPrompt = NEXT_ACTION_PROMPTS[widenOptionsStep.type];

      return toStructuredCallToolResult(
        [successMessage, '', nextActionPrompt],
        response,
        false
      );
    },
    (error) => {
      const errorMessage = OptionSelectionAggregate.toErrorMessage(error);
      return toCallToolResult([`${ERROR_MESSAGE_PREFIX}${errorMessage}`], true);
    }
  );
};