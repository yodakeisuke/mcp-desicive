import { Result, ok, err } from 'neverthrow';

/**
 * Option Selection Term Model Implementation
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
 * - policy: Business policies and rules
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Value Types - Branded Types for Type Safety
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 語彙「OptionId」
 * domain type: value
 */
type OptionId = string & { readonly _brand: 'OptionId' };

const OptionId = {
  generate: (): OptionId => {
    return `option-${Date.now()}-${Math.random().toString(36).substring(2, 11)}` as OptionId;
  },
  
  fromString: (value: string): Result<OptionId, ValidationError[]> => {
    const errors = validateOptionId(value);
    return errors.length > 0 ? err(errors) : ok(value as OptionId);
  },
  
  toString: (id: OptionId): string => id
} as const;

/**
 * 語彙「OptionText」
 * domain type: value
 * 
 * 選択肢の文字列（30文字まで）
 */
type OptionText = string & { readonly _brand: 'OptionText' };

const OptionText = {
  create: (value: string): Result<OptionText, ValidationError[]> => {
    const errors = validateOptionText(value);
    return errors.length > 0 ? err(errors) : ok(value.trim() as OptionText);
  },
  
  toString: (text: OptionText): string => text
} as const;

/**
 * 語彙「Option」
 * domain type: value
 */
type Option = {
  readonly id: OptionId;
  readonly text: OptionText;
  readonly supplementaryInfo?: string;
};

type RequestedOption = {
  text: string;
  supplementaryInfo?: string;
};

/**
 * 語彙「OptionList」
 * domain type: policy
 * 
 * Business rule: 選択肢は3〜5個である
 */
type OptionList = {
  readonly options: readonly Option[];
} & { readonly _brand: 'OptionList' };

type RequestedOptionList = {
  options: readonly RequestedOption[];
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Error Types - Validation Failures
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type ValidationError = {
  readonly type: 'required' | 'too_short' | 'too_long' | 'invalid_format' | 'invalid_count';
  readonly field: string;
  readonly message: string;
};

type OptionError = {
  readonly type: 'InvalidTitle' | 'InvalidDescription' | 'InvalidId' | 'OptionCreationFailed';
  readonly message: string;
};

type OptionListError = {
  readonly type: 'InvalidOptionCount' | 'OptionCreationFailed';
  readonly message: string;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// eDSL (embedded Domain Specific Language)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type ConstructOption = (params: RequestedOption) => Result<Option, OptionError[]>;
type ConstructOptionList = (params: RequestedOptionList) => Result<OptionList, OptionListError[]>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Implementation Section - Business Logic
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Smart constructor for Option
const constructOption: ConstructOption = (params) =>
  OptionText.create(params.text)
    .andThen(text => {
      const option: Option = {
        id: OptionId.generate(),
        text,
        ...(params.supplementaryInfo && { supplementaryInfo: params.supplementaryInfo })
      };
      return ok(option);
    })
    .mapErr(errors => errors.map(e => 
      OptionError.create('OptionCreationFailed', `Text validation failed: ${e.message}`)
    ));

// Smart constructor for OptionList with business rule enforcement
const constructOptionList: ConstructOptionList = (params) =>
  validateOptionListParams(params)
    .andThen(validParams => 
      createOptionsFromParams(validParams.options)
        .andThen(options =>
          validateOptionListBusinessRules(options)
            .map(() => createOptionList(options))
        )
    );

// Helper functions
const validateOptionListParams = (params: RequestedOptionList): Result<RequestedOptionList, OptionListError[]> => {
  const errors: OptionListError[] = [];
  
  if (!params.options || params.options.length === 0) {
    errors.push(OptionListError.create('InvalidOptionCount', 'Options array cannot be empty'));
  }
  
  return errors.length > 0 ? err(errors) : ok(params);
};

const createOptionsFromParams = (optionParams: readonly RequestedOption[]): Result<Option[], OptionListError[]> => {
  const optionResults = optionParams.map((optionParam, index) => 
    constructOption(optionParam)
      .mapErr(optionErrors => 
        OptionListError.create('OptionCreationFailed', 
          `Option ${index + 1}: ${optionErrors.map(e => e.message).join(', ')}`
        )
      )
  );
  
  return Result.combine(optionResults).mapErr(errors => [errors]);
};

const validateOptionListBusinessRules = (options: Option[]): Result<null, OptionListError[]> => {
  const errors = validateOptionCount(options);
  return errors.length > 0 ? err(errors) : ok(null);
};

const createOptionList = (options: Option[]): OptionList => {
  return {
    options: options as readonly Option[]
  } as OptionList;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Business Rules - Domain Policies
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const validateOptionId = (value: string): ValidationError[] => {
  if (!value || value.trim().length === 0) {
    return [ValidationError.create('required', 'optionId', 'Option ID is required')];
  }
  return [];
};

const validateOptionText = (value: string): ValidationError[] => {
  if (!value || value.trim().length === 0) {
    return [ValidationError.create('required', 'text', '選択肢は必須です')];
  }
  if (value.length > 30) {
    return [ValidationError.create('too_long', 'text', '選択肢は30文字以内で入力してください')];
  }
  return [];
};

// Business rule: 選択肢は3〜5個である
const validateOptionCount = (options: Option[]): OptionListError[] => {
  if (options.length < 3 || options.length > 5) {
    return [OptionListError.create('InvalidOptionCount', 
      `Option count must be between 3 and 5, but got ${options.length}`)];
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

const OptionError = {
  create: (type: OptionError['type'], message: string): OptionError => ({ type, message })
} as const;

const OptionListError = {
  create: (type: OptionListError['type'], message: string): OptionListError => ({ type, message })
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Public API - Term Model Interface
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Option Term Model
 */
export const OptionModel = {
  create: constructOption
} as const;

/**
 * OptionList Term Model
 */
export const OptionListModel = {
  create: constructOptionList
} as const;

/**
 * Value Object Constructors
 */
export const Values = {
  OptionId,
  OptionText
} as const;

/**
 * Type Exports for External Use
 */
export type {
  Option,
  RequestedOption,
  OptionList,
  RequestedOptionList,
  OptionId,
  OptionText,
  ValidationError,
  OptionError,
  OptionListError
};