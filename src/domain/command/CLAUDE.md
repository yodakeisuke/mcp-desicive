# Command Model Coding Guide for AI Agents

This guide provides essential patterns for implementing **Command Models** (equivalent to Aggregates in DDD). Commands produce events and encapsulate business logic in this event-centric architecture.

## Core Philosophy
- 集約は、コマンドを受け取ってイベントを返します
  - コマンドは集約に対する操作である関数です
    - リクエストデータと、リードモデルをinputとします
    - outputはイベントです
- 集約は、不変条件を一貫させる単位です
  - ビジネスルール関数として、不変条件を宣言的にエンコードします

## Quick Reference
When implementing a new command model:

1. **Create the command directory** in `/src/domain/command/[feature]/`
2.Always refer to [`./samples/aggregate/plan-aggregate-example.ts`](_sample-code/plan-aggregate-example.ts) for the complete pattern.