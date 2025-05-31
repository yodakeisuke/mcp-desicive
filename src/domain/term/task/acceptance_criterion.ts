import { Result, ok, err } from 'neverthrow';
import { v4 as uuidv4 } from 'uuid';

/**
 * 語彙「受け入れ条件」
 * domain type: value
 */

// --- modeling section ---
// state
type AcceptanceCriterionState =
  | RequestedAcceptanceCriterion
  | AcceptanceCriterion
  | AcceptanceCriterionError[];

// eDSL
type ConstructAcceptanceCriterion = (
  params: RequestedAcceptanceCriterion
) => Result<AcceptanceCriterion, AcceptanceCriterionError[]>;

// --- data definitions ---
type RequestedAcceptanceCriterion = {
  readonly scenario: string;
  readonly given: readonly string[];
  readonly when: readonly string[];
  readonly then: readonly string[];
};

export type AcceptanceCriterion = {
  readonly id: string;
  readonly scenario: string;
  readonly given: readonly string[];
  readonly when: readonly string[];
  readonly then: readonly string[];
  readonly isCompleted: boolean;
  readonly createdAt: Date;
};

type AcceptanceCriterionError = {
  type: 'InvalidScenario' | 'EmptyGiven' | 'EmptyWhen' | 'EmptyThen' | 'InvalidArrayElement';
  message: string;
};

// --- implementation section ---
// workflow
const constructAcceptanceCriterion: ConstructAcceptanceCriterion = (params) => {
  const errors = [
    ...mustHaveValidScenario(params.scenario),
    ...mustHaveValidSteps(params.given, 'given'),
    ...mustHaveValidSteps(params.when, 'when'),
    ...mustHaveValidSteps(params.then, 'then')
  ];
  
  return errors.length > 0 
    ? err(errors) 
    : ok(createAcceptanceCriterion(params));
};

// sub tasks
const createAcceptanceCriterion = (params: RequestedAcceptanceCriterion): AcceptanceCriterion => ({
  id: uuidv4(),
  scenario: params.scenario,
  given: params.given,
  when: params.when,
  then: params.then,
  isCompleted: false,
  createdAt: new Date()
});

// business rules
const mustHaveValidScenario = (scenario: string): AcceptanceCriterionError[] =>
  !scenario.trim() 
    ? [AcceptanceCriterionError.create('InvalidScenario', 'Scenario cannot be empty')]
    : [];

const mustHaveValidSteps = (
  steps: readonly string[], 
  field: 'given' | 'when' | 'then'
): AcceptanceCriterionError[] => {
  if (steps.length === 0) {
    const errorTypeMap = {
      given: 'EmptyGiven',
      when: 'EmptyWhen', 
      then: 'EmptyThen'
    } as const;
    return [AcceptanceCriterionError.create(
      errorTypeMap[field], 
      `At least one ${field} step is required`
    )];
  }
  
  const emptyStepIndex = steps.findIndex(step => !step.trim());
  return emptyStepIndex !== -1
    ? [AcceptanceCriterionError.create(
        'InvalidArrayElement',
        `${field} step at index ${emptyStepIndex} cannot be empty`
      )]
    : [];
};

// error
const AcceptanceCriterionError = {
  create: (type: AcceptanceCriterionError['type'], message: string): AcceptanceCriterionError => 
    ({ type, message })
} as const;

// --- API section ---
export const AcceptanceCriterion = {
  create: constructAcceptanceCriterion
} as const;

export { RequestedAcceptanceCriterion, AcceptanceCriterionError };