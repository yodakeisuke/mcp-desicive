import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { OptionSelectionAggregate } from '../../../domain/command/option-selection.js';
import { Values } from '../../../domain/term/option.js';
import { saveOptions } from '../../../effect/options-storage.js';
import { toStructuredCallToolResult, toCallToolResult } from '../util.js';
import { SUCCESS_MESSAGE_TEMPLATE, ERROR_MESSAGE_PREFIX, processTemplate } from './prompt.js';
import type { RegisterOptionsParams, RegisterOptionsResponse } from './schema.js';

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