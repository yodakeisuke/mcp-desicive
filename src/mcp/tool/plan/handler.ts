import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ResultAsync } from 'neverthrow';
import { PlanToolParameters, planViewToResponse } from './schema.js';
import { forPlanCreated } from './prompt.js';
import { toCallToolResult } from '../util.js';
import { PlanAggregate } from '../../../domain/command/plan/aggregate.js';
import { planViewQueries } from '../../../domain/read/master_plan/index.js';
import { savePlan } from '../../../effect/storage/planStorage.js';

export const planEntryPoint = (args: PlanToolParameters): Promise<CallToolResult> => {
  const commandResult = PlanAggregate.createPlan({
    name: args.name,
    description: args.description,
    tasks: args.tasks.map(task => ({
      ...task,
      dependencies: task.dependencies?.map(dep => dep as any)
    }))
  }).mapErr(error => ({ type: 'CommandError' as const, message: PlanAggregate.toErrorMessage(error) }));
  
  return commandResult.match(
    event => savePlan(event.plan)
      .mapErr(storageError => ({ type: 'StorageError' as const, message: `${storageError.type} - ${storageError.message}` }))
      .map(() => event)
      .andThen(event => 
        ResultAsync.fromPromise(
          Promise.resolve().then(() => {
            const planView = planViewQueries.fromPlan(event.plan);
            const response = planViewToResponse(planView);
            return [forPlanCreated, JSON.stringify(response, null, 2)] as const;
          }),
          error => ({ type: 'ViewError' as const, message: `Failed to build response: ${(error as Error).message}` })
        )
      )
      .match(
        messages => toCallToolResult([...messages], false),
        error => toCallToolResult([`Failed to create plan: ${error.message}`], true)
      ),
    error => Promise.resolve(toCallToolResult([`Failed to create plan: ${error.message}`], true))
  );
};