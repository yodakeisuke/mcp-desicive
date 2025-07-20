// Pure prompt strings for register-options tool

export const SUCCESS_MESSAGE_TEMPLATE = `✅ {{count}}個の選択肢を登録しました:

{{optionsList}}`;

export const ERROR_MESSAGE_PREFIX = `❌ `;

export const TOOL_DESCRIPTION = `選択肢を登録します（3-5個、各30文字まで）。

このツールは意思決定支援のために選択肢リストを登録し、3-5個の制約を強制します。

使用例:
- ランチの選択肢: ["カレー", "ラーメン", "寿司", "定食"]
- 会議時間の選択肢: ["10:00-11:00", "14:00-15:00", "16:00-17:00"]
- プロジェクト手法: ["アジャイル", "ウォーターフォール", "ハイブリッド"]`;

// Template processing utility
export const processTemplate = (template: string, variables: Record<string, any>): string => {
  let result = template;
  
  // Handle {{#if variable}} blocks
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
    return variables[varName] ? content : '';
  });
  
  // Handle {{variable}} replacements
  result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] || '';
  });
  
  return result;
};