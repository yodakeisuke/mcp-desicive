# Read Model Implementation Guide for AI Agents

This guide provides essential patterns for implementing **Read Models** in our CQRS architecture. Read models are optimized for queries and built from event projections.

## Core Philosophy
リードモデルは、UIにリターンするデータ構造または、コマンドのinputとなる復元されたstateのスキーマです。
> "Read models are projections of events, optimized for specific query patterns"

Read models serve the "Query" side of CQRS:
- **Event Projections**: Build state from domain events
- **Query Optimization**: Structure data for efficient reads
- **View Specialization**: Different views for different use cases
- **Eventual Consistency**: Accept slight delays for better performance

## Quick Reference
When implementing a new read model:

1. **Define the view types** in `types.ts`
2. **Implement event projections** in `projections.ts`
3. **Create query functions** in `queries.ts`  
4. **Export public API** in `index.ts`
常に、上記1~4 の全てが必要というわけではない。必要なもののみ作成すること。

Always refer to the sample code and production examples for concrete implementations of these patterns.

## Sample Code Reference

### Complete Read Model Implementation
- **File**: [`./src/domain/read/_sample-code/read-model-example.ts`](./_sample-code/read-model-example.ts)
- **Purpose**: Demonstrates complete read model patterns
- **Key concepts**: Event projections, query functions, view specialization

### Production Reference
- **Directory**: [`./src/domain/read/master_plan/`](./master_plan/)
- **Files**: 
  - [`types.ts`](./master_plan/types.ts) - Read model types
  - [`queries.ts`](./master_plan/queries.ts) - Query functions
  - [`projections.ts`](./master_plan/projections.ts) - Event projections