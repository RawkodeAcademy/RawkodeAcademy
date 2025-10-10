import { describe, expect, it } from 'vitest';
import { acceptRaiseHand, createRaiseHand, isActive, rejectRaiseHand } from './raise-hand-domain';

describe('raise hand domain', () => {
  it('creates, accepts, and rejects requests with guard rails', () => {
    const request = createRaiseHand({ showId: 'show-1', userId: 'user-1' });
    expect(isActive(request)).toBe(true);

    const accepted = acceptRaiseHand(request);
    expect(accepted.status).toBe('ACCEPTED');

    expect(() => acceptRaiseHand(accepted)).toThrow('Only open raise-hand requests can be accepted');

    const rejectedDraft = createRaiseHand({ showId: 'show-1', userId: 'user-2' });
    const rejected = rejectRaiseHand(rejectedDraft);
    expect(rejected.status).toBe('REJECTED');
    expect(() => rejectRaiseHand(rejected)).toThrow('Only open raise-hand requests can be rejected');
  });
});
