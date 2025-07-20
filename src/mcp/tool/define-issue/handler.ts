import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DefineIssueParams, DefineIssueResponse, defineIssueSchema } from './schema.js';
import { toStructuredCallToolResult } from '../util.js';
import { saveIssueDefinition, FileSystemError } from '../../../effect/index.js';
import { IssueDefinitionAggregate, DefineIssueRequest, IssueDefinitionError } from '../../../domain/command/define-issue.js';
import { WorkflowState } from '../../../domain/term/workflow-state.js';
import { updateState, WorkflowStateStorageError } from '../../../effect/workflow-state-storage.js';
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

const generateStateErrorResponse = (stateError: WorkflowStateStorageError): CallToolResult => {
  let message: string;
  let guidance: string;

  switch (stateError.type) {
    case 'invalid_transition':
      message = `状態遷移エラー: ${stateError.from.type} から ${stateError.to.type} への遷移は無効です`;
      guidance = "現在の状態から有効な遷移を確認してください。";
      break;
    case 'file_system_error':
      const fsError = stateError.error;
      message = `ファイルシステムエラー: ${fsError.message}`;
      
      switch (fsError.type) {
        case 'permission_denied':
          guidance = "ディレクトリの書き込み権限を確認してください。";
          break;
        case 'disk_full':
          guidance = "ディスクの空き容量を確認してください。";
          break;
        case 'directory_create_failed':
          guidance = "ディレクトリの作成権限を確認してください。";
          break;
        default:
          guidance = "ファイルシステムの状態を確認してください。";
      }
      break;
    case 'parse_error':
      message = `データ解析エラー: ${stateError.message}`;
      guidance = "データファイルが破損している可能性があります。強制的に状態をリセットすることを検討してください。";
      break;
    default:
      message = `状態管理エラー: 予期しないエラーが発生しました`;
      guidance = "システム管理者に相談してください。";
  }

  return toStructuredCallToolResult(
    [message, guidance],
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

  if (saveResult.isErr()) {
    return generateFileSystemErrorResponse(saveResult.error);
  }

  // 課題定義が成功したら状態を遷移
  const stateResult = await updateState(WorkflowState.issueDefined());
  
  return stateResult.match(
    () => generateSuccessResponse(event.issueDefinition.issue),
    (stateError) => generateStateErrorResponse(stateError)
  );
};