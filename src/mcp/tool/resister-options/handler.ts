import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { OptionSelectionAggregate } from '../../../domain/command/option-selection.js';
import { Values } from '../../../domain/term/option.js';
import { saveOptions } from '../../../effect/options-storage.js';
import { toStructuredCallToolResult, toCallToolResult } from '../util.js';
import { SUCCESS_MESSAGE_TEMPLATE, ERROR_MESSAGE_PREFIX, processTemplate } from './prompt.js';
import type { RegisterOptionsParams, RegisterOptionsResponse } from './schema.js';
import { WorkflowState } from '../../../domain/term/workflow-state.js';
import { updateState, WorkflowStateStorageError } from '../../../effect/workflow-state-storage.js';

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

      // 選択肢登録が成功したら状態を遷移
      const stateResult = await updateState(WorkflowState.initialOptionsRegistered());
      
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

      const response: RegisterOptionsResponse = {
        options
      };

      const optionsList = options
        .map((opt, idx) => `${idx + 1}. ${opt.text}`)
        .join('\n');

      const successMessage = processTemplate(SUCCESS_MESSAGE_TEMPLATE, {
        count: options.length,
        optionsList: optionsList
      });

      return toStructuredCallToolResult(
        [successMessage],
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