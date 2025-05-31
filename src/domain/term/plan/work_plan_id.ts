import { ID } from '../../../common/primitive.js';

/**
 * 語彙「WorkPlan」
 * domain type: value
 */
export type WorkPlanId = ID<'WorkPlan'>;
export const generateWorkPlanId = (): WorkPlanId => {
  return `WorkPlan_${Date.now()}_${Math.random().toString(36).substring(2, 11)}` as WorkPlanId;
};