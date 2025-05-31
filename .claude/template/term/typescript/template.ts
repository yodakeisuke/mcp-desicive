/**
 * ==================================================================
 * ドメイン語彙 TypeScript テンプレート
 * ==================================================================
 * 
 * このテンプレートは src/domain/term/plan/work_plan.ts をモデルケースとして
 * ドメイン語彙のTypeScript表現を統一的に作成するためのテンプレートです。
 * 
 * 【使用方法】
 * 1. このファイルをコピーして新しいファイルを作成
 * 2. 以下のプレースホルダーを実際の値に置換する
 * 
 * 【置換が必要なプレースホルダー】
 * - [TermName]: 語彙名（例: WorkPlan, PrTask）
 * - [termVariableName]: 語彙のvariable名（例: workPlan, prTask）
 * - [property]: プロパティ名
 * - [type]: プロパティの型
 * - [RelatedTerm]: 関連する語彙の型名
 * - [relatedOperations]: 関連する語彙のoperations
 * - [related]: 関連する語彙のディレクトリ名
 * - [related_term]: 関連する語彙のファイル名
 * - [TermId]: ID型名（例: WorkPlanId）
 * - [ErrorType1], [ErrorType2], [ErrorType3]: エラータイプ名
 * - [businessRule1], [businessRule2]: ビジネスルール関数名
 * - [parameterType]: パラメータの型
 * - [invalidCondition]: 無効な条件
 * - [additionalValidationIfNeeded]: 追加バリデーション
 * - [paramsToResultTransformation]: パラメータから結果への変換
 * - [additionalParams]: 追加パラメータ
 * 
 * 【domain typeの指定】
 * - operation: 操作を表す（例: ワークプラン作成）
 * - entity: エンティティを表す（例: ワークプラン、タスク）
 * - value: 値オブジェクトを表す（例: ID、名前）
 * 
 * 【persistentの指定】
 * - true: 永続化が必要
 * - false: 永続化不要（一時的な操作など）
 * 
 * 【テンプレートの構造】
 * 1. type modeling section: 状態とeDSLの型定義
 * 2. data definitions: データ型の定義
 * 3. implementation section: 実装部分
 *    - workflow: メインの処理フロー
 *    - sub tasks: サブタスク
 *    - business rules: ビジネスルール
 * 4. API section: 外部に公開するAPI
 * 
 * 【関数型プログラミングのパターン】
 * - Result<T, E>を使用したエラーハンドリング
 * - andThen, map, mapErrを使った合成
 * - ビジネスルールの分離
 * - 副作用の最小化
 * ==================================================================
 */

import { Result, ok, err } from 'neverthrow';
// TODO: 必要なドメイン語彙をimportする
// import { [RelatedTerm], [relatedOperations] } from '../[related]/[related_term].js';
// import { [TermId], generate[TermId] } from './[term_id].js';

/**
 * 語彙「[TermName]」
 * domain type: [operation|entity|value] // operationかentityかvalueかを指定
 * persistent: [true|false] // 永続化が必要かどうか
 */

// --- type modeling section ---
// state
type [TermName]State =
    | Requested[TermName]
    | [TermName]
    | [TermName]Error[];

// eDSL (Entity/Operationの場合)
type Construct[TermName] = (
    params: Requested[TermName]
) => Result<[TermName], [TermName]Error[]>

// --- data definitions ---
export type Requested[TermName] = {
    // TODO: 必要なプロパティを定義
    [property]: [type];
};

export type [TermName] = {
    // TODO: 必要なプロパティを定義 (entityの場合はreadonlyにする)
    readonly [property]: [type];
    readonly createdAt: Date; // entityの場合
    readonly updatedAt: Date; // entityの場合
};

export type [TermName]Error = {
    type: '[ErrorType1]' | '[ErrorType2]' | '[ErrorType3]';
    message: string;
}

// --- implementation section ---
// workflow (operationの場合)
const construct[TermName]: Construct[TermName] = (params) =>
  validate[TermName]Params(params)
    .andThen(() => [additionalValidationIfNeeded])
    .map([paramsToResultTransformation])
    .map(result => create[TermName](params, result));

// sub tasks
const validate[TermName]Params = (params: Requested[TermName]): Result<null, [TermName]Error[]> => {
  const errors = [
    // TODO: ビジネスルールを呼び出し
    ...[businessRule1](params.[property]),
    ...[businessRule2](params.[property])
  ];
  return errors.length > 0 ? err(errors) : ok(null);
};

const create[TermName] = (params: Requested[TermName], [additionalParams]): [TermName] => {
  const now = new Date();
  return {
    // TODO: 必要なプロパティを設定
    [property]: params.[property],
    createdAt: now, // entityの場合
    updatedAt: now, // entityの場合
  };
};

// business rules
const [businessRule1] = ([parameterType]): [TermName]Error[] => {
  // TODO: ビジネスルールを実装
  if ([invalidCondition]) {
    return [{ type: '[ErrorType1]', message: '[error message]' }];
  }
  return [];
};

const [businessRule2] = ([parameterType]): [TermName]Error[] => {
  // TODO: ビジネスルールを実装
  if ([invalidCondition]) {
    return [{ type: '[ErrorType2]', message: '[error message]' }];
  }  
  return [];
};

// --- API section --- ※important!!:  export が許可されるのはこのセクションのみです！
export const [termVariableName] = { // コンパニオンオブジェクトとして export
    create: construct[TermName], // operationの場合
    // TODO: その他必要なoperationを追加
} 