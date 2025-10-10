import { closePoll, createPoll, createVote, openPoll, tallyVotes } from '../domain/poll-domain';
import type { Poll, PollVote } from '../domain/types';
import type { PollRepository, PollVoteRepository } from './ports';

export class PollService {
  constructor(
    private readonly polls: PollRepository,
    private readonly votes: PollVoteRepository,
  ) {}

  async create(draft: Parameters<typeof createPoll>[0]): Promise<Poll> {
    const poll = createPoll(draft);
    await this.polls.save(poll);
    return poll;
  }

  async open(id: string): Promise<Poll> {
    const poll = await this.require(id);
    const opened = openPoll(poll);
    await this.polls.update(opened);
    return opened;
  }

  async close(id: string): Promise<Poll> {
    const poll = await this.require(id);
    const closed = closePoll(poll);
    await this.polls.update(closed);
    return closed;
  }

  async vote(id: string, voterKey: string, optionIndex: number): Promise<PollVote> {
    const poll = await this.require(id);
    const alreadyVoted = await this.votes.hasVoted(id, voterKey);
    if (alreadyVoted) {
      throw new Error('Duplicate vote detected');
    }
    const vote = createVote(poll, voterKey, optionIndex);
    await this.votes.save(vote);
    return vote;
  }

  async results(id: string): Promise<{ poll: Poll; tallies: number[] }> {
    const poll = await this.require(id);
    const votes = await this.votes.listByPoll(id);
    return { poll, tallies: tallyVotes(poll, votes) };
  }

  private async require(id: string): Promise<Poll> {
    const poll = await this.polls.findById(id);
    if (!poll) {
      throw new Error(`Poll ${id} not found`);
    }
    return poll;
  }
}
