# Requirements Document

## Introduction

現状把握ツールは、WRAP意思決定プロセスにおいて現在定義されている課題（Issue）の情報を取得するためのMCPツールです。このツールにより、AIエージェントは意思決定プロセスの任意の段階で現在の課題状況を確認し、適切な次のアクションを決定できます。

## Requirements

### Requirement 1

**User Story:** As an AI agent, I want to retrieve the current issue information, so that I can understand the current decision-making context and determine appropriate next actions.

#### Acceptance Criteria

Rule: 課題情報の取得
現在保存されている課題情報を構造化された形式で取得する

Example: 課題が存在する場合の取得
```gherkin
Given 課題が既に定義されている
When 現状把握ツールが実行される
Then 課題の詳細情報が構造化された形式で返される
  And 課題ID、タイトル、説明、作成日時が含まれる
  And ツール実行結果はResult.ok形式で返される
```

Example: 課題が存在しない場合の取得
```gherkin
Given 課題がまだ定義されていない
When 現状把握ツールが実行される
Then "課題が定義されていません"というメッセージが返される
  And ツール実行結果はResult.ok形式で返される（エラーではない）
```

### Requirement 2

**User Story:** As an AI agent, I want to receive structured output from the current status tool, so that I can programmatically process the issue information and integrate it with other WRAP framework tools.

#### Acceptance Criteria

Rule: 構造化された出力形式
ツールの出力は一貫した構造化形式で提供される

Example: 構造化された成功レスポンス
```gherkin
Given 有効な課題情報が存在する
When 現状把握ツールが実行される
Then レスポンスにテキストメッセージとJSONデータの両方が含まれる
  And JSONデータには課題の完全な情報が含まれる
  And isErrorフラグがfalseに設定される
```

Example: 構造化された情報なしレスポンス
```gherkin
Given 課題情報が存在しない
When 現状把握ツールが実行される
Then レスポンスにテキストメッセージとnullのJSONデータが含まれる
  And isErrorフラグがfalseに設定される
```

### Requirement 3

**User Story:** As an AI agent, I want the current status tool to handle errors gracefully, so that I can continue the decision-making process even when unexpected issues occur.

#### Acceptance Criteria

Rule: エラーハンドリング
システムエラーが発生した場合でも適切にハンドリングされる

Example: ファイルシステムエラーのハンドリング
```gherkin
Given ファイルシステムへのアクセスでエラーが発生する
When 現状把握ツールが実行される
Then エラーメッセージが適切に返される
  And ツール実行結果はResult.err形式で返される
  And エラーの詳細が含まれる
```

Example: データ破損時のハンドリング
```gherkin
Given 保存された課題データが破損している
When 現状把握ツールが実行される
Then データ破損エラーメッセージが返される
  And ツール実行結果はResult.err形式で返される
```

### Requirement 4

**User Story:** As an AI agent, I want the current status tool to integrate seamlessly with the existing WRAP framework architecture, so that I can use it as part of a comprehensive decision-making workflow.

#### Acceptance Criteria

Rule: アーキテクチャ統合
既存のWRAPフレームワークのアーキテクチャパターンに従う

Example: ドメイン層との統合
```gherkin
Given 現状把握ツールが実行される
When ドメイン層の読み取り操作が呼び出される
Then 既存のResult型パターンが使用される
  And エフェクト層を通じてファイルシステムにアクセスする
```

Example: MCPツールとしての統合
```gherkin
Given MCPクライアントから現状把握ツールが呼び出される
When ツールが実行される
Then 構造化された出力がCallToolResult形式で返される
  And 既存のtoStructuredCallToolResultパターンが使用される
```