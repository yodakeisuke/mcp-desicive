import { Result, ok, err } from 'neverthrow';

/**
 * 語彙「Definition of Ready」
 * domain type: value
 */

// --- modeling section ---
// state
type DefinitionOfReadyState =
  | RequestedDefinitionOfReady
  | DefinitionOfReady
  | DefinitionOfReadyError[];

// eDSL
type ValidateDefinitionOfReady = (
  items: RequestedDefinitionOfReady
) => Result<DefinitionOfReady, DefinitionOfReadyError[]>;

// --- data definitions ---
type RequestedDefinitionOfReady = readonly string[];

type DefinitionOfReady = readonly string[];

type DefinitionOfReadyError = {
  type: 'EmptyItem' | 'InvalidArrayElement';
  message: string;
};

// --- implementation section ---
// workflow
const validateDefinitionOfReady: ValidateDefinitionOfReady = (items) => {
  const errors = mustHaveValidItems(items);
  return errors.length > 0 ? err(errors) : ok(items);
};

// business rules
const mustHaveValidItems = (items: readonly string[]): DefinitionOfReadyError[] => {
  const errors: DefinitionOfReadyError[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || item.trim().length === 0) {
      errors.push(DefinitionOfReadyError.create(
        'EmptyItem',
        `DoR item at index ${i} cannot be empty`
      ));
    }
  }
  
  return errors;
};

// error
const DefinitionOfReadyError = {
  create: (type: DefinitionOfReadyError['type'], message: string): DefinitionOfReadyError => 
    ({ type, message })
} as const;

// --- API section ---
export const DefinitionOfReady = {
  validate: validateDefinitionOfReady
} as const;

export type { RequestedDefinitionOfReady };