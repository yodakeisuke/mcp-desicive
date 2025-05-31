// PrTaskStatus ADT
export type PrTaskStatus =
  | { type: 'ToBeRefined' }
  | { type: 'Refined' }
  | { type: 'Implemented' }
  | { type: 'Reviewed' }
  | { type: 'QAPassed' }
  | { type: 'Blocked'; reason: string; since: Date }
  | { type: 'Abandoned'; reason: string; at: Date };

export const PrTaskStatus = {
  toBeRefined: (): PrTaskStatus => ({ type: 'ToBeRefined' }),
  refined: (): PrTaskStatus => ({ type: 'Refined' }),
  implemented: (): PrTaskStatus => ({ type: 'Implemented' }),
  reviewed: (): PrTaskStatus => ({ type: 'Reviewed' }),
  qaPassed: (): PrTaskStatus => ({ type: 'QAPassed' }),
  blocked: (reason: string, since?: Date): PrTaskStatus => ({ type: 'Blocked', reason, since: since ?? new Date() }),
  abandoned: (reason: string, at?: Date): PrTaskStatus => ({ type: 'Abandoned', reason, at: at ?? new Date() }),

  // Status transition validation
  canTransition: (from: PrTaskStatus, to: PrTaskStatus): boolean => {
    if (from.type === 'QAPassed' || from.type === 'Abandoned') {
      return false;
    }

    if (to.type === 'Blocked' || to.type === 'Abandoned') {
      return true;
    }

    const validTransitions: Record<string, string[]> = {
      'ToBeRefined': ['Refined'],
      'Refined': ['Implemented'],
      'Implemented': ['Reviewed', 'ToBeRefined', 'Refined'],
      'Reviewed': ['QAPassed', 'Implemented', 'ToBeRefined', 'Refined'],
      'Blocked': ['ToBeRefined', 'Refined', 'Implemented', 'Reviewed'],
    };

    return validTransitions[from.type]?.includes(to.type) ?? false;
  },

  isTerminal: (status: PrTaskStatus): boolean => {
    return status.type === 'QAPassed' || status.type === 'Abandoned';
  },

  toString: (status: PrTaskStatus): string => {
    switch (status.type) {
      case 'ToBeRefined':
        return 'To Be Refined';
      case 'Refined':
        return 'Refined';
      case 'Implemented':
        return 'Implemented';
      case 'Reviewed':
        return 'Reviewed';
      case 'QAPassed':
        return 'QA Passed';
      case 'Blocked':
        return `Blocked: ${status.reason}`;
      case 'Abandoned':
        return `Abandoned: ${status.reason}`;
      default:
        throw new Error(`Unknown status type: ${status satisfies never}`);
    }
  }
} as const;