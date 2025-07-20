import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DefineIssueParams, DefineIssueResponse, defineIssueSchema } from './schema.js';
import { toStructuredCallToolResult } from '../util.js';
import { saveIssueDefinition, FileSystemError } from '../../../effect/index.js';
import { IssueDefinitionAggregate, DefineIssueRequest, IssueDefinitionError } from '../../../domain/command/define-issue.js';
import {
  NEXT_ACTION_GUIDANCE,
  SUCCESS_MESSAGE_TEMPLATE,
  DOMAIN_ERROR_MESSAGE,
  VALIDATION_ERROR_MESSAGE,
  VALIDATION_CORRECTION_GUIDANCE,
  FILESYSTEM_ERROR_GUIDANCE,
  VALIDATION_SPECIFIC_GUIDANCE,
  INVALID_PARAMS_MESSAGE
} from './prompt.js';

const generateSuccessResponse = (issue: string): CallToolResult => {
  const structuredData: DefineIssueResponse = { issue };

  return toStructuredCallToolResult(
    [
      SUCCESS_MESSAGE_TEMPLATE(issue),
      NEXT_ACTION_GUIDANCE
    ],
    structuredData,
    false
  );
};

const generateDomainErrorResponse = (error: IssueDefinitionError): CallToolResult => {
  const errorMessage = IssueDefinitionAggregate.toErrorMessage(error);
  
  return toStructuredCallToolResult(
    [
      DOMAIN_ERROR_MESSAGE,
      errorMessage
    ],
    null,
    true
  );
};

const generateFileSystemErrorResponse = (fsError: FileSystemError): CallToolResult => {
  const correctionGuidance = FILESYSTEM_ERROR_GUIDANCE[fsError.type] || FILESYSTEM_ERROR_GUIDANCE.unknown;

  return toStructuredCallToolResult(
    [
      `ファイルシステムエラー: ${fsError.message}`,
      correctionGuidance
    ],
    null,
    true
  );
};

export const defineIssueHandler = async (args: unknown): Promise<CallToolResult> => {
  const zodResult = defineIssueSchema.safeParse(args);
  if (!zodResult.success) {
    // Zod validation errors should be processed as validation errors
    const errorMessages = zodResult.error.issues.map(issue => issue.message);
    const correctionGuidance = `${VALIDATION_CORRECTION_GUIDANCE}\n` +
      errorMessages.map(msg => `• ${msg}`).join('\n');

    return toStructuredCallToolResult(
      [
        VALIDATION_ERROR_MESSAGE,
        correctionGuidance
      ],
      null,
      true
    );
  }

  const request: DefineIssueRequest = zodResult.data;
  const domainResult = IssueDefinitionAggregate.defineIssue(request);

  if (domainResult.isErr()) {
    // ドメインエラーを詳細なバリデーションエラーとして処理
    const error = domainResult.error;
    if (error.type === 'ValidationFailed') {
      const errorMessages = error.validationErrors.map(validationError => {
        const specificGuidance = VALIDATION_SPECIFIC_GUIDANCE[validationError.type](validationError.field);
        return `${validationError.message} ${specificGuidance}`;
      });

      const correctionGuidance = `${VALIDATION_CORRECTION_GUIDANCE}\n` +
        errorMessages.map(msg => `• ${msg}`).join('\n');

      return toStructuredCallToolResult(
        [
          VALIDATION_ERROR_MESSAGE,
          correctionGuidance
        ],
        null,
        true
      );
    }
    return generateDomainErrorResponse(domainResult.error);
  }

  const event = domainResult.value;
  const saveResult = await saveIssueDefinition(event.issueDefinition);

  return saveResult.match(
    () => generateSuccessResponse(event.issueDefinition.issue),
    (fsError) => generateFileSystemErrorResponse(fsError)
  );
};