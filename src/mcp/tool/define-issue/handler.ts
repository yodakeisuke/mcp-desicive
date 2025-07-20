import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DefineIssueParams, DefineIssueResponse, defineIssueSchema } from './schema.js';
import { toStructuredCallToolResult } from '../util.js';
import { saveIssueDefinition, FileSystemError } from '../../../effect/index.js';
import { IssueDefinitionAggregate, DefineIssueRequest, IssueDefinitionError } from '../../../domain/command/define-issue.js';

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

const generateDomainErrorResponse = (error: IssueDefinitionError): CallToolResult => {
  const errorMessage = IssueDefinitionAggregate.toErrorMessage(error);
  
  return toStructuredCallToolResult(
    [
      "ドメインエラーが発生しました。",
      errorMessage
    ],
    null,
    true
  );
};

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

export const defineIssueHandler = async (args: unknown): Promise<CallToolResult> => {
  const zodResult = defineIssueSchema.safeParse(args);
  if (!zodResult.success) {
    return toStructuredCallToolResult(["入力パラメータが無効です"], null, true);
  }

  const request: DefineIssueRequest = zodResult.data;
  const domainResult = IssueDefinitionAggregate.defineIssue(request);

  if (domainResult.isErr()) {
    // ドメインエラーを詳細なバリデーションエラーとして処理
    const error = domainResult.error;
    if (error.type === 'ValidationFailed') {
      const errorMessages = error.validationErrors.map(validationError => {
        let specificGuidance = "";

        switch (validationError.type) {
          case 'required':
            specificGuidance = `${validationError.field}は必須項目です。`;
            break;
          case 'too_short':
            specificGuidance = `${validationError.field}は1文字以上で入力してください。`;
            break;
          case 'too_long':
            const maxLength = validationError.field === 'issue' ? '30' : '60';
            specificGuidance = `${validationError.field}は${maxLength}文字以内で入力してください。`;
            break;
          case 'invalid_type':
            specificGuidance = `${validationError.field}は文字列で入力してください。`;
            break;
        }

        return `${validationError.message} ${specificGuidance}`;
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