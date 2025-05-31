import { Result, ok, err } from 'neverthrow';
import { ID, NonEmptyString } from '../../../common/primitive.js';

/**
 * 語彙「PRタスクID」
 * domain type: value
 */

// --- modeling section ---
export type PrTaskId = ID<'PrTask'>;

type PrTaskIdError = { type: 'InvalidPrTaskId'; message: string };

// --- implementation section ---
const PrTaskIdError = {
  create: (message: string): PrTaskIdError => ({ type: 'InvalidPrTaskId', message })
} as const;


// --- API section ---
export const PrTaskId = {
  generate: (): PrTaskId => {
    return `prtask_${Date.now()}_${Math.random().toString(36).substring(2, 11)}` as PrTaskId;
  }
} as const;