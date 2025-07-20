// AI instruction prompts for define-issue tool

export const NEXT_ACTION_GUIDANCE = 
  "課題が正常に定義されました。次は「Widen Options（選択肢を広げる）」ステップに進み、" +
  "可能な解決策や選択肢を洗い出しましょう。";

export const SUCCESS_MESSAGE_TEMPLATE = (issue: string) => 
  `課題「${issue}」を正常に登録しました。`;

export const DOMAIN_ERROR_MESSAGE = "ドメインエラーが発生しました。";

export const VALIDATION_ERROR_MESSAGE = "入力検証エラーが発生しました。";

export const VALIDATION_CORRECTION_GUIDANCE = "以下の項目を修正して再実行してください：";

export const FILESYSTEM_ERROR_GUIDANCE = {
  permission_denied: "権限エラーの解決方法：\n" +
    "• ディレクトリの書き込み権限を確認してください\n" +
    "• ファイルが他のプロセスで使用されていないか確認してください\n" +
    "• 管理者権限で実行することを検討してください",

  directory_create_failed: "ディレクトリ作成エラーの解決方法：\n" +
    "• 親ディレクトリの書き込み権限を確認してください\n" +
    "• 同名のファイルが存在しないか確認してください\n" +
    "• パスに無効な文字が含まれていないか確認してください",

  file_write_failed: "ファイル書き込みエラーの解決方法：\n" +
    "• ファイルの書き込み権限を確認してください\n" +
    "• ファイルが読み取り専用になっていないか確認してください\n" +
    "• ファイルが他のアプリケーションで開かれていないか確認してください",

  disk_full: "ディスク容量エラーの解決方法：\n" +
    "• ディスクの空き容量を確認してください\n" +
    "• 不要なファイルを削除して容量を確保してください\n" +
    "• 別のディスクへの保存を検討してください",

  unknown: "予期しないファイルシステムエラーの解決方法：\n" +
    "• システムの状態を確認してください\n" +
    "• 一時的な問題の可能性があるため、しばらく待ってから再実行してください\n" +
    "• 問題が継続する場合は、システム管理者に相談してください"
};

export const VALIDATION_SPECIFIC_GUIDANCE = {
  required: (field: string) => `${field}は必須項目です。`,
  too_short: (field: string) => `${field}は1文字以上で入力してください。`,
  too_long: (field: string) => {
    const maxLength = field === 'issue' ? '30' : '60';
    return `${field}は${maxLength}文字以内で入力してください。`;
  },
  invalid_type: (field: string) => `${field}は文字列で入力してください。`
};

export const INVALID_PARAMS_MESSAGE = "入力パラメータが無効です";