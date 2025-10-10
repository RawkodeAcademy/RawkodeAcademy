import type {
  IsoManifest,
  IsoPart,
  Poll,
  PollVote,
  RaiseHandRequest,
  Show,
} from '../domain/types';
import type {
  IsoManifestRepository,
  IsoPartRepository,
  PollRepository,
  PollVoteRepository,
  RaiseHandRepository,
  ShowRepository,
} from '../application/ports';

export class InMemoryShowRepository implements ShowRepository {
  private readonly store = new Map<string, Show>();

  async save(show: Show): Promise<void> {
    this.store.set(show.id, show);
  }

  async findById(id: string): Promise<Show | null> {
    return this.store.get(id) ?? null;
  }

  async list(): Promise<Show[]> {
    return Array.from(this.store.values()).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }
}

export class InMemoryRaiseHandRepository implements RaiseHandRepository {
  private readonly store = new Map<string, RaiseHandRequest[]>();

  async save(request: RaiseHandRequest): Promise<void> {
    const requests = this.store.get(request.showId) ?? [];
    requests.push(request);
    this.store.set(request.showId, requests);
  }

  async listByShow(showId: string): Promise<RaiseHandRequest[]> {
    return [...(this.store.get(showId) ?? [])];
  }

  async update(request: RaiseHandRequest): Promise<void> {
    const items = this.store.get(request.showId) ?? [];
    const index = items.findIndex((item) => item.id === request.id);
    if (index === -1) {
      throw new Error('Raise-hand request not found');
    }
    items[index] = request;
    this.store.set(request.showId, items);
  }
}

export class InMemoryPollRepository implements PollRepository {
  private readonly store = new Map<string, Poll>();

  async save(poll: Poll): Promise<void> {
    this.store.set(poll.id, poll);
  }

  async update(poll: Poll): Promise<void> {
    this.store.set(poll.id, poll);
  }

  async findById(id: string): Promise<Poll | null> {
    return this.store.get(id) ?? null;
  }
}

export class InMemoryPollVoteRepository implements PollVoteRepository {
  private readonly store = new Map<string, PollVote[]>();

  async save(vote: PollVote): Promise<void> {
    const votes = this.store.get(vote.pollId) ?? [];
    votes.push(vote);
    this.store.set(vote.pollId, votes);
  }

  async listByPoll(pollId: string): Promise<PollVote[]> {
    return [...(this.store.get(pollId) ?? [])];
  }

  async hasVoted(pollId: string, voterKey: string): Promise<boolean> {
    const votes = this.store.get(pollId) ?? [];
    return votes.some((vote) => vote.voterKey === voterKey);
  }
}

export class InMemoryIsoManifestRepository implements IsoManifestRepository {
  private readonly store = new Map<string, IsoManifest>();

  async save(manifest: IsoManifest): Promise<void> {
    this.store.set(manifest.id, manifest);
  }

  async update(manifest: IsoManifest): Promise<void> {
    this.store.set(manifest.id, manifest);
  }

  async findById(id: string): Promise<IsoManifest | null> {
    return this.store.get(id) ?? null;
  }
}

export class InMemoryIsoPartRepository implements IsoPartRepository {
  private readonly store = new Map<string, IsoPart[]>();

  async save(part: IsoPart): Promise<void> {
    const parts = this.store.get(part.manifestId) ?? [];
    parts.push(part);
    this.store.set(part.manifestId, parts);
  }

  async listByManifest(manifestId: string): Promise<IsoPart[]> {
    return [...(this.store.get(manifestId) ?? [])];
  }
}

export interface RepositoryBundle {
  shows: InMemoryShowRepository;
  raiseHands: InMemoryRaiseHandRepository;
  polls: InMemoryPollRepository;
  pollVotes: InMemoryPollVoteRepository;
  isoManifests: InMemoryIsoManifestRepository;
  isoParts: InMemoryIsoPartRepository;
}

export const createRepositoryBundle = (): RepositoryBundle => ({
  shows: new InMemoryShowRepository(),
  raiseHands: new InMemoryRaiseHandRepository(),
  polls: new InMemoryPollRepository(),
  pollVotes: new InMemoryPollVoteRepository(),
  isoManifests: new InMemoryIsoManifestRepository(),
  isoParts: new InMemoryIsoPartRepository(),
});
