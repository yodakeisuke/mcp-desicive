import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { OptionSelectionAggregate } from '../../../domain/command/option-selection.js';
import { Values } from '../../../domain/term/option.js';
import { toStructuredCallToolResult, toCallToolResult } from '../util.js';
import type { GenerateOptionsParams, GenerateOptionsResponse } from './schema.js';

export const generateOptionsHandler = async (args: GenerateOptionsParams): Promise<CallToolResult> => {
  const result = OptionSelectionAggregate.generateOptions({
    context: args.context,
    criteria: args.criteria
  });

  return result.match(
    (event) => {
      const options = event.optionList.options.map(option => ({
        id: Values.OptionId.toString(option.id),
        title: option.title,
        description: option.description
      }));

      const response: GenerateOptionsResponse = {
        options,
        context: args.context,
        timestamp: new Date().toISOString()
      };

      const optionsList = options
        .map((opt, idx) => `${idx + 1}. **${opt.title}**\n   ${opt.description}`)
        .join('\n\n');

      const successMessage = `✅ Generated ${options.length} options for: "${args.context}"\n\n${optionsList}`;

      return toStructuredCallToolResult(
        [successMessage],
        response,
        false
      );
    },
    (error) => {
      const errorMessage = OptionSelectionAggregate.toErrorMessage(error);
      return toCallToolResult([`❌ ${errorMessage}`], true);
    }
  );
};