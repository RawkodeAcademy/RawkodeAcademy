import { beforeEach, describe, expect, it } from 'vitest';
import { RaiseHandService } from './raise-hand-service';
import { InMemoryRaiseHandRepository } from '../infrastructure/memory-repositories';

describe('RaiseHandService', () => {
  let service: RaiseHandService;

  beforeEach(() => {
    service = new RaiseHandService(new InMemoryRaiseHandRepository());
  });

  it('creates a request and lists it', async () => {
    const request = await service.create({ showId: 'show-123', userId: 'guest-1' });
    const requests = await service.list('show-123');
    expect(requests).toHaveLength(1);
    expect(requests[0]).toEqual(request);
  });

  it('accepts and rejects requests via BDD style assertions', async () => {
    const draft = await service.create({ showId: 'show-123', userId: 'guest-2' });

    const accepted = await service.accept(draft.id, draft.showId);
    expect(accepted.status).toBe('ACCEPTED');

    const rejectedDraft = await service.create({ showId: 'show-123', userId: 'guest-3' });
    const rejected = await service.reject(rejectedDraft.id, rejectedDraft.showId);
    expect(rejected.status).toBe('REJECTED');
  });
});
