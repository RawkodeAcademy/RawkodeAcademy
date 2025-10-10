import { IsoRecordingService } from '../application/iso-service';
import { PollService } from '../application/poll-service';
import { RaiseHandService } from '../application/raise-hand-service';
import { ShowService } from '../application/show-service';
import { createRepositoryBundle } from '../infrastructure/memory-repositories';

export interface Services {
  shows: ShowService;
  raiseHands: RaiseHandService;
  polls: PollService;
  iso: IsoRecordingService;
}

const globalKey = '__RKS_CONTAINER__';

type ContainerCache = { services: Services };

declare global {
  // eslint-disable-next-line no-var
  var __RKS_CONTAINER__: ContainerCache | undefined;
}

const createServices = (): Services => {
  const repositories = createRepositoryBundle();
  return {
    shows: new ShowService(repositories.shows),
    raiseHands: new RaiseHandService(repositories.raiseHands),
    polls: new PollService(repositories.polls, repositories.pollVotes),
    iso: new IsoRecordingService(repositories.isoManifests, repositories.isoParts),
  };
};

export const resolveServices = (): Services => {
  const globalRecord = globalThis as typeof globalThis & Record<typeof globalKey, ContainerCache | undefined>;
  if (!globalRecord[globalKey]) {
    globalRecord[globalKey] = { services: createServices() } satisfies ContainerCache;
  }
  return globalRecord[globalKey]!.services;
};
