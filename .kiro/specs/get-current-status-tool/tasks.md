# Implementation Plan

- [x] 1. Create domain read model for current status queries
  - Create `src/domain/read/current-status/` directory structure
  - Implement `types.ts` with IssueStatusView and ReadError types
  - Implement `index.ts` with getCurrentIssueStatus query function
  - Use Result types for error handling and integrate with existing effect layer
  - _Requirements: 1.1, 4.1_

- [x] 2. Create MCP tool schema definitions
  - Create `src/mcp/tool/get-current-status/schema.ts`
  - Define input schema (empty object) using Zod
  - Define output schema with hasIssue, issue, context, constraints, createdAt fields
  - Export TypeScript types derived from schemas
  - _Requirements: 2.1, 2.2_

- [x] 3. Implement MCP tool handler with structured output
  - Create `src/mcp/tool/get-current-status/handler.ts`
  - Implement handler function that calls domain read model
  - Handle three scenarios: issue exists, no issue defined, file system errors
  - Use toStructuredCallToolResult pattern for consistent output format
  - Include appropriate user guidance messages for each scenario
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 4. Create MCP tool export and registration
  - Create `src/mcp/tool/get-current-status/index.ts` with tool export
  - Register the new tool in `src/mcp/Server.ts`
  - Follow existing tool registration patterns
  - _Requirements: 4.2_

- [ ] 5. Write comprehensive unit tests for schema validation
  - Create `src/mcp/tool/get-current-status/schema.test.ts`
  - Test input schema validation (empty object should pass)
  - Test output schema validation with various data combinations
  - Test type inference from schemas
  - _Requirements: 2.1, 2.2_

- [ ] 6. Write unit tests for handler logic
  - Create `src/mcp/tool/get-current-status/handler.test.ts`
  - Test successful response when issue exists
  - Test successful response when no issue is defined
  - Test error handling for file system errors
  - Test error handling for data corruption scenarios
  - Mock domain layer dependencies for isolated testing
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [ ] 7. Write integration tests for end-to-end functionality
  - Create `src/mcp/tool/get-current-status/handler.integration.test.ts`
  - Test complete flow from MCP call to file system interaction
  - Test integration with define-issue tool (define → get status)
  - Test real file system operations and error scenarios
  - _Requirements: 1.1, 4.1, 4.2_

- [ ] 8. Update effect layer with enhanced error handling
  - Enhance `src/effect/issue-storage.ts` if needed for better error differentiation
  - Ensure loadIssueDefinition properly handles file-not-found vs other errors
  - Add any missing utility functions for the read model
  - _Requirements: 3.1, 3.2_