# Product Overview

## What is mcp-decisive

mcp-decisive は Chip & Dan Heath の WRAP フレームワークを Model Context Protocol 上に実装した、AI エージェント向けの質の高い意思決定プロセス支援「tool box」です。

## 背景・課題 / Problem Statement

AI Agent がそのまま意思決定を行っても、意思決定プロセスの質は担保されません。特に以下の4大バイアスに陥りがちです：

1. **視野の狭窄** - 選択肢が狭くなりがちで、OR 思考に陥る
2. **確証バイアス** - 自分の仮説を裏付ける情報ばかり集めてしまう  
3. **一時的感情** - 感情に流され長期視点を欠く
4. **自信過剰** - 楽観的見積りでリスクを見落とす

AI Agent は一般的発想・思考手順に陥りがちで、広く発散した思考や鋭い意思決定を行うことができません。

## ソリューション / Solution

mcp-decisive は WRAP フレームワークをツールセットとプロンプトセットに分解し、MCP サーバとして提供します：

- **W**iden Options - 選択肢を広げる
- **R**eality-Test Assumptions - 仮説を現実検証する  
- **A**ttain Distance - 距離を置いて判断する
- **P**repare to be Wrong - 間違いに備える

## 主要機能 / Key Features

- **インターリーブ実行**: 状況に応じてステップを任意の順序で実行・再実行可能
- **ワークフロー状態管理**: 思考・アクション履歴を構造化して保存
- **意思決定の道具箱**: 粒度の細かいツールを組み合わせて WRAP を実現
- **プロセス強制**: AI Agent が質の高い意思決定を行わざるを得ないレールを敷く

## 対象ユーザー / Target Users

質の高い意思決定プロセスを実行したい AI エージェント（MCP クライアント）

## 差別化ポイント / Differentiation

汎用 AI Agent やスプレッドシート・チェックリスト型ツールとは異なり：
- プロセスを強制できる
- 履歴が構造化される
- Model Context Protocol 準拠により AI Agent から直接利用可能
- 提供機能の使用により、AI Agent は高品質な意思決定手法を習得・実践できる

## MCP 実装アーキテクチャ / MCP Implementation

### Prompt 定義
意思決定プロセスを起動する役割（人間の操作で発火）：
- `/identify-the-issue` - WRAP プロセスで意思決定すべき対象のイシューを定義
  - Agent がユーザに課題をヒアリングするためのプロンプト
  - ヒアリング結果は tool「defineIssue」で登録

### Tool 定義
意思決定エキスパートが実際に用いる思考操作を「道具箱」として MCP ツールに実装：
- WRAP の 4 ステップは上位カテゴリ
- 公開 API は粒度の細かいツールを組み合わせて実現
- Agent は問題状況に応じてステップを任意の順序で実行・再実行可能

### 保存データ定義
**State:**
- workflow state（ワークフロー状態）
- 思考・アクション履歴

**Data:**
- 課題（Issue）
- 選択肢（Options）

## 目的 / Goal

WRAP フレームワークを Model Context Protocol として Agent 向けに提供し、prompt/tool/sampling の使用を通じて、Agent が質の高い意思決定を行わざるを得ないレールを敷くこと。