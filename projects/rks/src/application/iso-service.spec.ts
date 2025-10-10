import { beforeEach, describe, expect, it } from 'vitest';
import { IsoRecordingService } from './iso-service';
import { InMemoryIsoManifestRepository, InMemoryIsoPartRepository } from '../infrastructure/memory-repositories';

describe('IsoRecordingService', () => {
  let service: IsoRecordingService;

  beforeEach(() => {
    service = new IsoRecordingService(new InMemoryIsoManifestRepository(), new InMemoryIsoPartRepository());
  });

  it('initialises, appends, and completes an ISO manifest', async () => {
    const manifest = await service.init({ showId: 'show-iso', userId: 'guest-iso', kind: 'PROGRAM' });
    expect(manifest.totalParts).toBe(0);

    await service.append(manifest.id, 0, 1024, 'hash-0');
    await service.append(manifest.id, 1, 2048, 'hash-1');

    const completed = await service.complete(manifest.id, 'final-hash');
    expect(completed.status).toBe('COMPLETE');
    const parts = await service.partsFor(manifest.id);
    expect(parts).toHaveLength(2);
  });

  it('aborts an ISO manifest when requested', async () => {
    const manifest = await service.init({ showId: 'show-iso', userId: 'guest-iso', kind: 'VIDEO' });
    await service.append(manifest.id, 0, 512, 'hash');
    const aborted = await service.abort(manifest.id);
    expect(aborted.status).toBe('FAILED');
  });
});
