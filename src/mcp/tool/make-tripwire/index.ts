import { tripwireParams, tripwireOutputSchema } from './schema.js';
import { createTripwireHandler } from './handler.js';

export const createMakeTripwireTool = (server: any) => ({
  name: 'make-tripwire',
  description: 'クライアント側で各選択肢の撤退基準（トリップワイヤー）を検討し、設定するためのサンプリングツール',
  parameters: tripwireParams,
  outputSchema: tripwireOutputSchema,
  handler: createTripwireHandler(server)
});