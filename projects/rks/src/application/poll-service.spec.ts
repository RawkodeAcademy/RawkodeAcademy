import { beforeEach, describe, expect, it } from 'vitest';
import { PollService } from './poll-service';
import { InMemoryPollRepository, InMemoryPollVoteRepository } from '../infrastructure/memory-repositories';

const createDraft = () => ({
  showId: 'show-1',
  question: 'Favourite feature?',
  options: ['Viewer', 'Producer', 'Recorder'],
});

describe('PollService', () => {
  let service: PollService;

  beforeEach(() => {
    service = new PollService(new InMemoryPollRepository(), new InMemoryPollVoteRepository());
  });

  it('creates and opens a poll', async () => {
    const poll = await service.create(createDraft());
    expect(poll.status).toBe('DRAFT');

    const opened = await service.open(poll.id);
    expect(opened.status).toBe('OPEN');
  });

  it('closes an open poll', async () => {
    const poll = await service.create(createDraft());
    await service.open(poll.id);
    const closed = await service.close(poll.id);
    expect(closed.status).toBe('CLOSED');
  });

  it('prevents duplicate votes', async () => {
    const poll = await service.create(createDraft());
    await service.open(poll.id);
    await service.vote(poll.id, 'user-1', 0);
    await expect(service.vote(poll.id, 'user-1', 1)).rejects.toThrow('Duplicate vote detected');
  });

  it('calculates poll tallies', async () => {
    const poll = await service.create(createDraft());
    await service.open(poll.id);
    await service.vote(poll.id, 'user-1', 0);
    await service.vote(poll.id, 'user-2', 1);
    await service.vote(poll.id, 'user-3', 1);

    const { tallies } = await service.results(poll.id);
    expect(tallies).toEqual([1, 2, 0]);
  });

  it('throws when requesting a missing poll', async () => {
    await expect(service.results('missing')).rejects.toThrow('Poll missing not found');
  });
});
