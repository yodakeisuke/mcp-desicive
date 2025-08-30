import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { OptionSelectionAggregate } from '../../../domain/command/option-selection.js';
import { Values } from '../../../domain/term/option.js';
import { saveOptions } from '../../../effect/options-storage.js';
import { toStructuredCallToolResult, toCallToolResult } from '../util.js';
import { SUCCESS_MESSAGE_TEMPLATE, ERROR_MESSAGE_PREFIX, NEXT_ACTION_PROMPTS, processTemplate } from './prompt.js';
import type { RegisterOptionsParams, RegisterOptionsResponse } from './schema.js';
import { WorkflowState } from '../../../domain/term/workflow-state.js';
import { updateState } from '../../../effect/workflow-state-storage.js';
import { toWorkflowStateType } from '../../../domain/term/widen-options-steps.js';

export const createRegisterOptionsHandler = (server: McpServer) => async (args: RegisterOptionsParams): Promise<CallToolResult> => {
  // Convert input format to RequestedOption format
  let requestedOptions = args.options.map(option => {
    if (typeof option === 'string') {
      return { text: option };
    } else {
      return {
        text: option.text,
        ...(option.supplementaryInfo && { supplementaryInfo: option.supplementaryInfo })
      };
    }
  });

  // If more than 5 options are provided, elicit user input to drop some
  if (requestedOptions.length > 5) {
    const toDrop = requestedOptions.length - 5;
    try {
      let remaining = requestedOptions.slice();
      for (let step = 0; step < toDrop; step++) {
        const elicitResult = await (server as any).server.elicitInput({
          message: `候補が${requestedOptions.length}件あります。5件に収めるため、${toDrop}件を順に1件ずつ落としてください（${step + 1}/${toDrop}件目）。`,
          requestedSchema: {
            type: 'object',
            properties: {
              dropIndex: {
                type: 'string',
                title: '今回落とす候補',
                description: 'リストから1件選択',
                enum: Array.from({ length: remaining.length }, (_, i) => String(i + 1)),
                enumNames: remaining.map((o, i) => `${i + 1}. ${o.text}`)
              }
            },
            required: ['dropIndex']
          }
        });

        if (elicitResult.action !== 'accept') {
          return toCallToolResult([
            `${ERROR_MESSAGE_PREFIX}ユーザー操作により選択肢の間引きが中断されました（action=${elicitResult.action}）。`],
            true
          );
        }

        const dropIndexRaw: unknown = (elicitResult as any).content?.dropIndex;
        const parsed = typeof dropIndexRaw === 'string' && /^\d+$/.test(dropIndexRaw) ? parseInt(dropIndexRaw, 10) : NaN;
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > remaining.length) {
          return toCallToolResult([
            `${ERROR_MESSAGE_PREFIX}不正な選択です。もう一度やり直してください。`],
            true
          );
        }

        // Remove the selected index from remaining
        remaining.splice(parsed - 1, 1);
      }

      requestedOptions = remaining;
    } catch (e) {
      return toCallToolResult([
        `${ERROR_MESSAGE_PREFIX}対話的入力の取得に失敗しました: ${e instanceof Error ? e.message : String(e)}`
      ], true);
    }
  }

  const result = OptionSelectionAggregate.registerOptions({
    options: requestedOptions
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
        text: Values.OptionText.toString(option.text),
        ...(option.supplementaryInfo && { supplementaryInfo: option.supplementaryInfo })
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
