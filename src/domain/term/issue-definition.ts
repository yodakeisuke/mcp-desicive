import { Result, ok, err } from 'neverthrow';

/**
 * Issue Definition Term Model Implementation
 * 
 * This demonstrates the Term Model pattern for Domain-Driven Design:
 * - Domain vocabulary as executable code
 * - Smart constructors with validation
 * - Immutable value objects
 * - Business rule enforcement
 * - Type-safe domain modeling
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Domain Type Classification
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Term types in this domain:
 * - value: Value objects and identifiers
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Value Types - Branded Types for Type Safety
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 語彙「IssueText」
 * domain type: value
 */
type IssueText = string & { readonly _brand: 'IssueText' };

const IssueText = {
  create: (value: string): Result<IssueText, ValidationError[]> => {
    const errors = validateIssueText(value);
    return errors.length > 0 ? err(errors) : ok(value.trim() as IssueText);
  },
  
  toString: (issueText: IssueText): string => issueText
} as const;

/**
 * 語彙「ContextText」
 * domain type: value
 */
type ContextText = string & { readonly _brand: 'ContextText' };

const ContextText = {
  create: (value: string): Result<ContextText, ValidationError[]> => {
    const errors = validateContextText(value);
    return errors.length > 0 ? err(errors) : ok(value.trim() as ContextText);
  },
  
  toString: (contextText: ContextText): string => contextText
} as const;

/**
 * 語彙「ConstraintText」
 * domain type: value
 */
type ConstraintText = string & { readonly _brand: 'ConstraintText' };

const ConstraintText = {
  create: (value: string): Result<ConstraintText, ValidationError[]> => {
    const errors = validateConstraintText(value);
    return errors.length > 0 ? err(errors) : ok(value.trim() as ConstraintText);
  },
  
  toString: (constraintText: ConstraintText): string => constraintText
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Types - Validation Failures
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type ValidationError = {
  readonly type: 'required' | 'too_short' | 'too_long' | 'invalid_type';
  readonly field: string;
  readonly message: string;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Business Rules - Domain Policies
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const validateIssueText = (value: string): ValidationError[] => {
  if (!value || value.trim().length === 0) {
    return [ValidationError.create('required', 'issue', '課題は必須です')];
  }
  if (value.length > 30) {
    return [ValidationError.create('too_long', 'issue', '課題は30文字以内で入力してください')];
  }
  return [];
};

const validateContextText = (value: string): ValidationError[] => {
  if (!value || value.trim().length === 0) {
    return [ValidationError.create('required', 'context', 'コンテキストは必須です')];
  }
  if (value.length > 60) {
    return [ValidationError.create('too_long', 'context', 'コンテキストは60文字以内で入力してください')];
  }
  return [];
};

const validateConstraintText = (value: string): ValidationError[] => {
  if (!value || value.trim().length === 0) {
    return [ValidationError.create('required', 'constraints', '制約は必須です')];
  }
  if (value.length > 60) {
    return [ValidationError.create('too_long', 'constraints', '制約は60文字以内で入力してください')];
  }
  return [];
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Handling Utilities
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ValidationError = {
  create: (type: ValidationError['type'], field: string, message: string): ValidationError => ({
    type, field, message
  })
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Public API - Term Model Interface
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Value Object Constructors
 */
export const Values = {
  IssueText,
  ContextText,
  ConstraintText
} as const;

// Export constructors directly
export { IssueText, ContextText, ConstraintText };

/**
 * Type Exports for External Use
 */
export type { ValidationError };