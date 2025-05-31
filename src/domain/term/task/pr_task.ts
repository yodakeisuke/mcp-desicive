import { Result, ok, err } from 'neverthrow';
import { PrTaskStatus } from './status.js';
import { PrTaskId } from './pr_task_id.js';
import { ID } from '../../../common/primitive.js';
import { AcceptanceCriterion, RequestedAcceptanceCriterion } from './acceptance_criterion.js';
import { DefinitionOfReady, type RequestedDefinitionOfReady } from './definition_of_ready.js';

/**
 * 語彙「PRタスク」
 * domain type: operation
 */

// --- modeling section ---
// state
type PrTaskState =
  | RequestedPrTask
  | PrTask
  | PrTaskError[];

// ID types
export type AgentId = ID<'Agent'>;

// eDSL
type ConstructPrTask = (
  params: RequestedPrTask
) => Result<PrTask, PrTaskError[]>;

type UpdatePrTaskStatus = (
  task: PrTask,
  newStatus: PrTaskStatus
) => Result<PrTask, PrTaskError[]>;

type ApplyUpdate = (
  task: PrTask,
  update: PrTaskUpdate
) => Result<PrTask, PrTaskError[]>;

// --- data definitions ---
type RequestedPrTask = {
  id: string;
  title: string;
  description: string;
  dependencies?: PrTaskId[];
  acceptanceCriteria: ReadonlyArray<{
    readonly scenario: string;
    readonly given: readonly string[];
    readonly when: readonly string[];
    readonly then: readonly string[];
  }>;
  definitionOfReady: RequestedDefinitionOfReady;
};

type PrTaskUpdate = {
  title?: string;
  description?: string;
  status?: PrTaskStatus;
  dependencies?: PrTaskId[];
  estimatedHours?: number;
};

export type PrTask = {
  readonly id: PrTaskId;
  readonly title: string;
  readonly description: string;
  readonly branch: string;
  readonly status: PrTaskStatus;
  readonly dependencies: PrTaskId[];
  readonly acceptanceCriteria: readonly AcceptanceCriterion[];
  readonly definitionOfReady: readonly string[];
  readonly assignedTo?: AgentId;
  readonly estimatedHours?: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

type PrTaskError = {
  type: 'InvalidTitle' | 'InvalidDescription' | 'InvalidId' | 'InvalidStatusTransition' | 'TaskCreationFailed' | 'AcceptanceCriteriaCreationFailed' | 'DefinitionOfReadyValidationFailed';
  message: string;
};

// --- implementation section ---
// workflow
const constructPrTask: ConstructPrTask = (params) =>
  validatePrTaskParams(params)
    .andThen(validParams => 
      createAcceptanceCriteriaFromParams(validParams.acceptanceCriteria)
        .andThen(criteria =>
          DefinitionOfReady.validate(validParams.definitionOfReady)
            .andThen(validatedDoR =>
              ok(createPrTask({
                ...validParams,
                acceptanceCriteria: criteria,
                definitionOfReady: validatedDoR
              }))
            )
            .mapErr(dorErrors => 
              dorErrors.map(dorError => 
                PrTaskError.create(
                  'DefinitionOfReadyValidationFailed',
                  `DoR validation failed: ${dorError.message}`
                )
              )
            )
        )
    );

const updatePrTaskStatus: UpdatePrTaskStatus = (task, newStatus) =>
  mustAllowStatusTransition(task.status, newStatus)
    ? ok({
        ...task,
        status: newStatus,
        updatedAt: new Date()
      })
    : err([PrTaskError.create('InvalidStatusTransition', 
        `Cannot transition from ${PrTaskStatus.toString(task.status)} to ${PrTaskStatus.toString(newStatus)}`
      )]);

const applyUpdate: ApplyUpdate = (task, update) => {
  const statusResult = update.status
    ? updatePrTaskStatus(task, update.status)
    : ok(task);

  return statusResult
    .map(updatedTask => ({
      ...updatedTask,
      title: update.title ?? task.title,
      description: update.description ?? task.description,
      dependencies: update.dependencies ?? task.dependencies,
      estimatedHours: update.estimatedHours ?? task.estimatedHours,
      updatedAt: new Date()
    }))
    .mapErr(errors => errors);
};

// error
const PrTaskError = {
  create: (type: PrTaskError['type'], message: string): PrTaskError => ({ type, message })
} as const;

// sub tasks
const validatePrTaskParams = (params: RequestedPrTask): Result<RequestedPrTask, PrTaskError[]> => {
  const errors = [
    ...mustHaveValidTitle(params.title),
    ...mustHaveValidDescription(params.description),
    ...mustHaveValidAcceptanceCriteria(params.acceptanceCriteria)
  ];
  return errors.length > 0 ? err(errors) : ok(params);
};

const createPrTask = (params: RequestedPrTask & { acceptanceCriteria: readonly AcceptanceCriterion[]; definitionOfReady: readonly string[] }): PrTask => {
  const now = new Date();
  return {
    id: PrTaskId.generate(),
    title: params.title,
    description: params.description,
    branch: `feature/${params.id}`,
    status: PrTaskStatus.toBeRefined(),
    dependencies: params.dependencies ?? [],
    acceptanceCriteria: params.acceptanceCriteria,
    definitionOfReady: params.definitionOfReady,
    estimatedHours: undefined,
    createdAt: now,
    updatedAt: now
  };
};

const createAcceptanceCriteriaFromParams = (
  criteriaParams: ReadonlyArray<RequestedAcceptanceCriterion>
): Result<readonly AcceptanceCriterion[], PrTaskError[]> => {
  const results: AcceptanceCriterion[] = [];
  const errors: PrTaskError[] = [];
  
  for (const param of criteriaParams) {
    const result = AcceptanceCriterion.create(param);
    if (result.isOk()) {
      results.push(result._unsafeUnwrap());
    } else {
      const criterionErrors = result._unsafeUnwrapErr();
      for (const criterionError of criterionErrors) {
        errors.push(PrTaskError.create(
          'AcceptanceCriteriaCreationFailed',
          `Failed to create acceptance criterion: ${criterionError.message}`
        ));
      }
    }
  }
  
  if (errors.length > 0) {
    return err(errors);
  }
  
  return ok(results);
};

// business rules
const mustHaveValidTitle = (title: string): PrTaskError[] => {
  if (!title || title.trim().length === 0) {
    return [PrTaskError.create('InvalidTitle', 'Task title is required')];
  }
  if (title.length < 5) {
    return [PrTaskError.create('InvalidTitle', 'Task title must be at least 5 characters')];
  }
  return [];
};

const mustHaveValidDescription = (description: string): PrTaskError[] => {
  if (!description || description.trim().length === 0) {
    return [PrTaskError.create('InvalidDescription', 'Task description is required')];
  }
  return [];
};

const mustHaveValidAcceptanceCriteria = (criteria: ReadonlyArray<RequestedAcceptanceCriterion>): PrTaskError[] => {
  if (criteria.length === 0) {
    return [PrTaskError.create('AcceptanceCriteriaCreationFailed', 'At least one acceptance criterion is required')];
  }
  return [];
};

const mustAllowStatusTransition = (currentStatus: PrTaskStatus, newStatus: PrTaskStatus): boolean =>
  PrTaskStatus.canTransition(currentStatus, newStatus);


// --- API section ---
export const PrTask = {
  create: constructPrTask,
  applyUpdate
} as const;