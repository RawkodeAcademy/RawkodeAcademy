import { describe, expect, it } from 'vitest';
import { closePoll, createPoll, createVote, isTransitionAllowed, openPoll, tallyVotes } from './poll-domain';

describe('poll domain', () => {
  const basePoll = createPoll({
    showId: 'show-1',
    question: 'Choose a feature',
    options: ['Viewer', 'Producer'],
  });

  it('allows transitions from draft to open only', () => {
    expect(isTransitionAllowed('DRAFT', 'OPEN')).toBe(true);
    expect(isTransitionAllowed('DRAFT', 'CLOSED')).toBe(false);
  });

  it('validates vote indices and states', () => {
    const open = openPoll(basePoll);
    expect(() => createVote(open, 'user-1', 2)).toThrow('Invalid option index');
    const closed = closePoll(open);
    expect(() => createVote(closed, 'user-1', 0)).toThrow('Poll must be open to accept votes');
  });

  it('tallies votes correctly', () => {
    const open = openPoll(basePoll);
    const votes = [
      createVote(open, 'user-1', 0),
      createVote(open, 'user-2', 1),
      createVote(open, 'user-3', 1),
    ];
    const tallies = tallyVotes(open, votes);
    expect(tallies).toEqual([1, 2]);
  });
});
