import { randomUUID } from 'node:crypto';
import { Show, ShowStatus, Identifier } from './types';

export type ShowDraft = Pick<Show, 'title' | 'description' | 'startsAt' | 'createdBy'>;

export const createShow = (draft: ShowDraft): Show => {
  const createdAt = new Date();
  return Show.parse({
    id: randomUUID(),
    title: draft.title,
    description: draft.description,
    startsAt: draft.startsAt,
    createdBy: draft.createdBy,
    status: 'DRAFT',
    createdAt,
  });
};

export const scheduleShow = (show: Show, startsAt: Date): Show => {
  if (show.status !== 'DRAFT') {
    throw new Error('Only draft shows can be scheduled');
  }
  if (startsAt.getTime() <= Date.now()) {
    throw new Error('Scheduled start must be in the future');
  }
  return { ...show, startsAt, status: 'SCHEDULED' };
};

export const startShow = (show: Show): Show => {
  if (!['SCHEDULED', 'DRAFT'].includes(show.status)) {
    throw new Error('Show must be scheduled or draft before going live');
  }
  return { ...show, status: 'LIVE' };
};

export const endShow = (show: Show): Show => {
  if (show.status !== 'LIVE') {
    throw new Error('Only live shows can be ended');
  }
  return { ...show, status: 'ENDED' };
};

export const ensureProducerOwnership = (show: Show, userId: Identifier): void => {
  if (show.createdBy !== userId) {
    throw new Error('Only the show owner may perform this action');
  }
};

export const canTransition = (from: ShowStatus, to: ShowStatus): boolean => {
  const allowed: Record<ShowStatus, ShowStatus[]> = {
    DRAFT: ['SCHEDULED', 'LIVE'],
    SCHEDULED: ['LIVE', 'ENDED'],
    LIVE: ['ENDED'],
    ENDED: [],
  };
  return allowed[from].includes(to);
};
