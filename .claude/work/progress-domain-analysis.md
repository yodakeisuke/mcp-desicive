# Progress Tool Domain Analysis

## Domain Vocabulary

### Core Concepts
1. **Progress Tracking** (進捗管理) - The process of tracking acceptance criteria completion
2. **Criteria Completion** (基準完了) - The state change of an acceptance criterion
3. **Automatic Status Transition** (自動ステータス遷移) - Status change based on completion state

### Domain Operations
1. **Update Progress** - Apply completion state changes to acceptance criteria
2. **Evaluate Completion** - Determine if all criteria are complete
3. **Transition Status** - Change task status based on completion state

### Business Rules
1. **Completion Rule**: A task is complete when ALL acceptance criteria are completed
2. **Transition Rules**:
   - Refined + All Complete → Implemented
   - Implemented/Reviewed + Some Incomplete → Refined
3. **Validation Rules**:
   - Only certain statuses allow progress updates
   - All criteria IDs must exist before any update

## Domain Model Design

### Location: `src/domain/term/task/progress.ts`
- Type: operation (業務手順)
- Purpose: Encapsulate progress tracking business logic

### Functions to Extract
1. `updateProgress` - Main workflow
2. `applyProgressUpdates` - Update criteria completion states
3. `evaluateCompletion` - Check if all criteria complete
4. `determineStatusTransition` - Calculate new status based on rules
5. `validateProgressUpdate` - Validate update is allowed

### Error Types
- `ProgressError` with specific error cases