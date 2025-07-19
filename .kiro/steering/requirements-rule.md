# Requirements Rule

## Overview

This rule defines the structure and classification for all requirement/specification documents in this project. All requirements must be categorized into one of three distinct types to ensure clarity and proper organization.

## Classification Categories

### 1. User Stories (ユーザーストーリー)
The highest-level specifications that describe complete user workflows and experiences.

**Characteristics:**
- Describes end-to-end user journeys
- Written from user perspective using "As a [role], I want [feature], so that [benefit]" format
- References tool definitions and glossary terms
- Focuses on business value and user outcomes

**Structure:**
```markdown
## User Story: [Story Name]

**As a** [user role]
**I want** [functionality]  
**So that** [business value]

### Acceptance Criteria
1. WHEN [condition] THEN [expected outcome]
2. IF [precondition] THEN [system behavior]

### Referenced Tools
- [tool-name]: [brief description of how it supports this story]

### Referenced Terms
- [term]: [how it relates to this story]
```

### 2. Tool Definitions (ツール定義)
Specifications for MCP tools, prompts, and domain operations that implement the user stories.

**Characteristics:**
- Defines specific MCP tools with structured output support
- References glossary terms for domain concepts
- Includes Zod schemas for input/output validation
- Maps to user stories they support
- Integrates with domain layer operations

**Structure:**
```markdown
## Tool: [tool-name]

### Purpose
[What this tool accomplishes and which user stories it supports]

### Type
- [ ] MCP Tool (with structured output)
- [ ] Prompt Definition
- [ ] Domain Operation

### Architecture Integration
- **Domain Layer**: [which command/read models it uses]
- **Effect Layer**: [side effects it triggers]
- **Error Handling**: [Result type patterns]

### Specification
**Input Schema (Zod):**
```typescript
const inputSchema = z.object({
  // Input validation schema
});
```

**Output Schema (Zod):**
```typescript
const outputSchema = z.object({
  // Structured output schema
});
```

**Handler Pattern:**
```typescript
export const handler = (args: InputType): Promise<CallToolResult> => {
  return domainOperation(args)
    .match(
      data => toStructuredCallToolResult(messages, data, false),
      error => toCallToolResult([error.message], true)
    );
};
```

**Behavior:**
- WHEN [input condition] THEN [tool behavior]
- IF [error condition] THEN [error handling with Result types]

### Referenced Terms
- [term]: [how this tool uses the term from domain vocabulary]

### Supported User Stories
- [story-name]: [how this tool supports the story]
```

### 3. Glossary (用語集)
Domain vocabulary and concept definitions used throughout the system.

**Characteristics:**
- Defines business concepts, models, and domain terms
- Provides precise definitions to ensure consistent usage
- Referenced by both user stories and tool definitions
- Includes relationships between terms
- Follows domain type classification system

**Structure:**
```markdown
## Term: [term-name]

### Definition
[Precise definition of the concept]

### Domain Type Classification
- [ ] **operation** (業務手順) - Business procedures and workflows
- [ ] **resource** (業務資源) - Business resources and entities  
- [ ] **policy** (業務ポリシー) - Business policies and rules
- [ ] **value** (値) - Value objects and identifiers

### Architecture Layer
- [ ] Command Model (Aggregate)
- [ ] Read Model (View/Projection)
- [ ] MCP Tool Interface
- [ ] Effect Layer (Side Effects)

### Properties
- **[property-name]**: [description]

### Relationships
- **Related to**: [other-terms]
- **Used by**: [tools that use this term]
- **Appears in**: [user stories that reference this term]

### Implementation Pattern
```typescript
// Code example showing usage pattern
// Include branded types, smart constructors, validation
```
```

## Document Organization Rules

### File Naming
- User Stories: `user-story-[name].md`
- Tool Definitions: `tool-[name].md`  
- Glossary: `glossary-[domain].md`

### Cross-References
- All documents MUST reference related terms from the glossary
- Tool definitions MUST specify which user stories they support
- User stories MUST reference the tools that implement them

### Validation Checklist
Before finalizing any requirement document, verify:

- [ ] Document is properly classified (User Story, Tool Definition, or Glossary)
- [ ] All referenced terms are defined in glossary
- [ ] Cross-references are bidirectional and accurate
- [ ] Acceptance criteria use EARS format (Easy Approach to Requirements Syntax)
- [ ] Tool definitions include complete input/output specifications
- [ ] User stories focus on business value, not implementation details

## Implementation Notes

This classification ensures:
1. **Traceability**: Clear path from user value to implementation
2. **Consistency**: Shared vocabulary across all specifications  
3. **Completeness**: All aspects of requirements are captured
4. **Maintainability**: Changes can be tracked through the reference network

When creating new requirements, always start by identifying which category the requirement belongs to, then follow the appropriate structure template.