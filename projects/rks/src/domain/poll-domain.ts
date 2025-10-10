import { randomUUID } from 'node:crypto';
import { Poll, PollStatus, PollVote } from './types';

export type PollDraft = Pick<Poll, 'showId' | 'question' | 'options'>;

export const createPoll = (draft: PollDraft): Poll => {
  const createdAt = new Date();
  return Poll.parse({
    id: randomUUID(),
    showId: draft.showId,
    question: draft.question,
    options: draft.options,
    status: 'DRAFT',
    createdAt,
  });
};

export const openPoll = (poll: Poll): Poll => {
  if (poll.status !== 'DRAFT') {
    throw new Error('Poll must be draft before opening');
  }
  return { ...poll, status: 'OPEN' };
};

export const closePoll = (poll: Poll): Poll => {
  if (poll.status !== 'OPEN') {
    throw new Error('Only open polls may be closed');
  }
  return { ...poll, status: 'CLOSED' };
};

export const createVote = (poll: Poll, voterKey: string, optionIndex: number): PollVote => {
  if (poll.status !== 'OPEN') {
    throw new Error('Poll must be open to accept votes');
  }
  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    throw new Error('Invalid option index');
  }
  return PollVote.parse({
    id: randomUUID(),
    pollId: poll.id,
    voterKey,
    optionIndex,
    createdAt: new Date(),
  });
};

export const tallyVotes = (poll: Poll, votes: PollVote[]): number[] => {
  return poll.options.map((_option, index) => votes.filter((vote) => vote.optionIndex === index).length);
};

export const isTransitionAllowed = (from: PollStatus, to: PollStatus): boolean => {
  const allowed: Record<PollStatus, PollStatus[]> = {
    DRAFT: ['OPEN'],
    OPEN: ['CLOSED'],
    CLOSED: [],
  };
  return allowed[from].includes(to);
};
