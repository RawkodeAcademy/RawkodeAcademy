/* c8 ignore file */
import type {
  IsoManifest,
  IsoPart,
  Poll,
  PollVote,
  RaiseHandRequest,
  Show,
} from '../domain/types';

export interface ShowRepository {
  save(show: Show): Promise<void>;
  findById(id: string): Promise<Show | null>;
  list(): Promise<Show[]>;
}

export interface RaiseHandRepository {
  save(request: RaiseHandRequest): Promise<void>;
  listByShow(showId: string): Promise<RaiseHandRequest[]>;
  update(request: RaiseHandRequest): Promise<void>;
}

export interface PollRepository {
  save(poll: Poll): Promise<void>;
  update(poll: Poll): Promise<void>;
  findById(id: string): Promise<Poll | null>;
}

export interface PollVoteRepository {
  save(vote: PollVote): Promise<void>;
  listByPoll(pollId: string): Promise<PollVote[]>;
  hasVoted(pollId: string, voterKey: string): Promise<boolean>;
}

export interface IsoManifestRepository {
  save(manifest: IsoManifest): Promise<void>;
  update(manifest: IsoManifest): Promise<void>;
  findById(id: string): Promise<IsoManifest | null>;
}

export interface IsoPartRepository {
  save(part: IsoPart): Promise<void>;
  listByManifest(manifestId: string): Promise<IsoPart[]>;
}
