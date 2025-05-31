/**
 * ==================================================================
 * ドメイン集約 TypeScript テンプレート
 * ==================================================================
 * 
 * このテンプレートは src/domain/command/plan/aggregate.ts をモデルケースとして
 * ドメイン集約のTypeScript表現を統一的に作成するためのテンプレートです。
 * 
 * 【使用方法】
 * 1. このファイルをコピーして新しいファイルを作成
 * 2. 以下のプレースホルダーを実際の値に置換する
 * 
 * 【置換が必要なプレースホルダー】
 * - [AggregateName]: 集約名（例: Plan, User, Order）
 * - [aggregateVariableName]: 集約のvariable名（例: planAggregate, userAggregate）
 * - [Entity]: 関連するエンティティ名（例: WorkPlan, User）
 * - [entityVariableName]: エンティティのvariable名（例: workPlan, user）
 * - [EntityId]: エンティティのID型（例: WorkPlanId, UserId）
 * - [Event]: イベント型名（例: PlanEvent, UserEvent）
 * - [Command1], [Command2]: コマンド名（例: CreatePlan, UpdatePlan）
 * - [Request1], [Request2]: リクエスト型名（例: CreatePlanRequested, UpdatePlanRequested）
 * - [Failed]: 失敗型名（例: PlanFailed, UserFailed）
 * - [ErrorType1], [ErrorType2], [ErrorType3]: エラータイプ名
 * - [commandDescription1], [commandDescription2]: コマンドの説明
 * - [utilityDescription]: ユーティリティ関数の説明
 * - [businessLogic1], [businessLogic2]: ビジネスロジック
 * - [errorReason]: エラー理由
 * - [contextProperty]: コンテキストプロパティ
 * 
 * 【集約の責務】
 * - コマンドの実行とイベントの生成
 * - ビジネスルールの適用
 * - 不変条件の維持
 * - 状態変更の一貫性保証
 * 
 * 【テンプレートの構造】
 * 1. type modeling section: イベント、コマンドの型定義
 * 2. data definitions: データ型の定義
 * 3. implementation section: コマンド実装
 *    - command APIs: コマンドの実装
 *    - error handling: エラー処理
 * 4. API section: 外部に公開するAPI
 * 
 * 【関数型プログラミングのパターン】
 * - Result<T, E>を使用したコマンド結果の表現
 * - イベントソーシングパターンの適用
 * - 副作用の境界の明確化
 * - エラーハンドリングの統一
 * ==================================================================
 */

import { Result } from 'neverthrow';
// TODO: 関連するドメイン語彙をimportする
// import { [Entity], [entityVariableName] } from '../../term/[entity_path]/[entity_file].js';
// import { [EntityId] } from '../../term/[entity_path]/[entity_id_file].js';
// import { [Event] } from './events.js';
// TODO: その他必要な依存関係をimportする

/**
 * 語彙「[AggregateName]コマンド」
 * domain type: command
 */

// --- type modeling section ---
// events
type [AggregateName] =
  | [Request1]
  | [Request2]
  | [Failed]

// commands
type [Command1]Command = (
    request: [Request1]
) => Result<[Event][], [Failed]>;

type [Command2]Command = (
    existing[Entity]: [Entity],
    request: [Request2],
) => Result<[Event][], [Failed]>;

// --- data definitions ---
type [Request1] = {
  // TODO: 必要なプロパティを定義
  [contextProperty]: [type];
};

type [Request2] = {
  // TODO: 必要なプロパティを定義
  [entityVariableName]Id: [EntityId];
  [contextProperty]: [type];
};

type [Failed] =
  | { type: '[ErrorType1]'; reason: string }
  | { type: '[ErrorType2]'; [contextProperty]: string }
  | { type: '[ErrorType3]'; reason: string };

// --- implementation section ---
// command APIs
const [command1]Command: [Command1]Command = (
    request: [Request1]
) =>
  [entityVariableName].[businessLogic1](request)
    .map([entity] => [[Event].[eventCreated]([entity].id, [entity])])
    .mapErr(errors => [AggregateName]CommandError.[errorType1](
      errors.map(e => `${e.type}: ${e.message}`).join('; ')
    ));

const [command2]Command: [Command2]Command = (
    existing[Entity],
    request
) =>
  [businessLogic2](existing[Entity], request.[contextProperty])
    .map([updatedProperty] => {
      const updated[Entity]: [Entity] = {
        ...existing[Entity],
        [updatedProperty],
        updatedAt: new Date()
      };
      return [[Event].[eventUpdated](updated[Entity].id, updated[Entity])];
    })
    .mapErr(error =>
        [AggregateName]CommandError.[errorType1](error)
    );

// error handling
const [AggregateName]CommandError = {
  [errorType1]: (reason: string): [Failed] =>
      ({ type: '[ErrorType1]', reason }),
  
  [errorType2]: ([contextProperty]: string): [Failed] =>
      ({ type: '[ErrorType2]', [contextProperty] }),
  
  [errorType3]: (reason: string): [Failed] =>
      ({ type: '[ErrorType3]', reason }),

  toString: (error: [Failed]): string => {
    switch (error.type) {
      case '[ErrorType1]':
        return `[ErrorType1]: ${error.reason}`;
      case '[ErrorType2]':
        return `[ErrorType2]: ${error.[contextProperty]}`;
      case '[ErrorType3]':
        return `[ErrorType3]: ${error.reason}`;
      default:
        throw new Error(`Unknown error type: ${error}`);
    }
  }
} as const;

// --- API section ---
/**
 * @command [command1]: [commandDescription1]
 * @command [command2]: [commandDescription2]
 * @utility toErrorMessage: [utilityDescription]
 */
export const [AggregateName]Aggregate = {
  [command1]: [command1]Command,
  [command2]: [command2]Command,
  toErrorMessage: [AggregateName]CommandError.toString,
} as const; 