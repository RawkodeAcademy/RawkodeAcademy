import { randomUUID } from 'node:crypto';
import { RaiseHandRequest } from './types';

export type RaiseHandDraft = Pick<RaiseHandRequest, 'showId' | 'userId'>;

export const createRaiseHand = (draft: RaiseHandDraft): RaiseHandRequest => {
  return RaiseHandRequest.parse({
    id: randomUUID(),
    showId: draft.showId,
    userId: draft.userId,
    status: 'OPEN',
    createdAt: new Date(),
  });
};

export const acceptRaiseHand = (request: RaiseHandRequest): RaiseHandRequest => {
  if (request.status !== 'OPEN') {
    throw new Error('Only open raise-hand requests can be accepted');
  }
  return { ...request, status: 'ACCEPTED' };
};

export const rejectRaiseHand = (request: RaiseHandRequest): RaiseHandRequest => {
  if (request.status !== 'OPEN') {
    throw new Error('Only open raise-hand requests can be rejected');
  }
  return { ...request, status: 'REJECTED' };
};

export const isActive = (request: RaiseHandRequest): boolean => request.status === 'OPEN';
