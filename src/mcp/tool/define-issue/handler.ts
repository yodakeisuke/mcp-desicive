import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Result, ok, err } from 'neverthrow';
import { ZodError } from 'zod';
import { DefineIssueParams, DefineIssueResponse, IssueDefinition, defineIssueSchema } from './schema.js';
import { toStructuredCallToolResult } from '../util.js';
import { saveIssueDefinition, FileSystemError } from '../../../effect/index.js';

/**
 * Generate success response with next action guidance
 */
const generateSuccessResponse = (issue: string): CallToolResult => {
  const structuredData: DefineIssueResponse = { issue };
  const nextActionGuidance =
    "課題が正常に定義されました。次は「Widen Options（選択肢を広げる）」ステップに進み、" +
    "可能な解決策や選択肢を洗い出しましょう。";

  return toStructuredCallToolResult(
    [
      `課題「${issue}」を正常に登録しました。`,
      nextActionGuidance
    ],
    structuredData,
    false
  );
};

/**
 * Validation error types for better error handling
 */
interface ValidationError {
  field: string;
  message: string;
  code: 'required' | 'too_short' | 'too_long' | 'invalid_type';
}

/**
 * Parse Zod validation errors into structured format
 */
const parseValidationErrors = (zodError: ZodError): ValidationError[] => {
  return zodError.errors.map(error => {
    const field = error.path.join('.');
    let code: ValidationError['code'] = 'invalid_type';

    switch (error.code) {
      case 'too_small':
        code = error.minimum === 1 ? 'required' : 'too_short';
        break;
      case 'too_big':
        code = 'too_long';
        break;
      case 'invalid_type':
        code = 'invalid_type';
        break;
    }

    return {
      field,
      message: error.message,
      code
    };
  });
};

/**
 * Validate input parameters using Zod schema with detailed error handling
 */
const validateInput = (args: unknown): Result<DefineIssueParams, ValidationError[]> => {
  const result = defineIssueSchema.safeParse(args);

  if (result.success) {
    return ok(result.data);
  }

  const validationErrors = parseValidationErrors(result.error);
  return err(validationErrors);
};

/**
 * Generate validation error response with specific field guidance
 */
const generateValidationErrorResponse = (errors: ValidationError[]): CallToolResult => {
  const errorMessages = errors.map(error => {
    let specificGuidance = "";

    switch (error.code) {
      case 'required':
        specificGuidance = `${error.field}は必須項目です。`;
        break;
      case 'too_short':
        specificGuidance = `${error.field}は1文字以上で入力してください。`;
        break;
      case 'too_long':
        const maxLength = error.field === 'issue' ? '30' : '60';
        specificGuidance = `${error.field}は${maxLength}文字以内で入力してください。`;
        break;
      case 'invalid_type':
        specificGuidance = `${error.field}は文字列で入力してください。`;
        break;
    }

    return `${error.message} ${specificGuidance}`;
  });

  const correctionGuidance = "以下の項目を修正して再実行してください：\n" +
    errorMessages.map(msg => `• ${msg}`).join('\n');

  return toStructuredCallToolResult(
    [
      "入力検証エラーが発生しました。",
      correctionGuidance
    ],
    null,
    true
  );
};

/**
 * Generate file system error response with specific correction guidance
 */
const generateFileSystemErrorResponse = (fsError: FileSystemError): CallToolResult => {
  let correctionGuidance: string;

  switch (fsError.type) {
    case 'permission_denied':
      correctionGuidance = "権限エラーの解決方法：\n" +
        "• ディレクトリの書き込み権限を確認してください\n" +
        "• ファイルが他のプロセスで使用されていないか確認してください\n" +
        "• 管理者権限で実行することを検討してください";
      break;

    case 'directory_create_failed':
      correctionGuidance = "ディレクトリ作成エラーの解決方法：\n" +
        "• 親ディレクトリの書き込み権限を確認してください\n" +
        "• 同名のファイルが存在しないか確認してください\n" +
        "• パスに無効な文字が含まれていないか確認してください";
      break;

    case 'file_write_failed':
      correctionGuidance = "ファイル書き込みエラーの解決方法：\n" +
        "• ファイルの書き込み権限を確認してください\n" +
        "• ファイルが読み取り専用になっていないか確認してください\n" +
        "• ファイルが他のアプリケーションで開かれていないか確認してください";
      break;

    case 'disk_full':
      correctionGuidance = "ディスク容量エラーの解決方法：\n" +
        "• ディスクの空き容量を確認してください\n" +
        "• 不要なファイルを削除して容量を確保してください\n" +
        "• 別のディスクへの保存を検討してください";
      break;

    case 'unknown':
    default:
      correctionGuidance = "予期しないファイルシステムエラーの解決方法：\n" +
        "• システムの状態を確認してください\n" +
        "• 一時的な問題の可能性があるため、しばらく待ってから再実行してください\n" +
        "• 問題が継続する場合は、システム管理者に相談してください";
      break;
  }

  return toStructuredCallToolResult(
    [
      `ファイルシステムエラー: ${fsError.message}`,
      correctionGuidance
    ],
    null,
    true
  );
};

/**
 * Define issue handler - implements the core business logic
 */
export const defineIssueHandler = async (args: unknown): Promise<CallToolResult> => {
  // 1. Input validation using Zod schema with detailed error handling
  const validationResult = validateInput(args);
  if (validationResult.isErr()) {
    return generateValidationErrorResponse(validationResult.error);
  }

  const validatedArgs = validationResult.value;

  // Create issue definition data structure
  const issueData: IssueDefinition = {
    issue: validatedArgs.issue,
    context: validatedArgs.context,
    constraints: validatedArgs.constraints
  };

  // Save to local file system using Result type with detailed error handling
  const saveResult = await saveIssueDefinition(issueData);

  return saveResult.match(
    () => generateSuccessResponse(validatedArgs.issue),
    (fsError) => generateFileSystemErrorResponse(fsError)
  );
};