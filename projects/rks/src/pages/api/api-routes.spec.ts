import { afterEach, describe, expect, it } from 'vitest';
import { GET as listShows, POST as createShow } from './shows/index';
import { GET as getShow } from './shows/[id]';
import { GET as listRaiseHands, POST as createRaiseHand } from './shows/[id]/raise-hand';
import { POST as createPoll } from './polls/index';
import { GET as pollResults, POST as pollActions } from './polls/[id]';
import { POST as vote } from './polls/[id]/vote';
import { POST as initIso } from './uploads/iso/init';
import { PUT as appendIso } from './uploads/iso/[id]/part';
import { POST as completeIso } from './uploads/iso/[id]/complete';
import { POST as abortIso } from './uploads/iso/[id]/abort';
import { resetContainer } from '../../test/container-helpers';

afterEach(() => {
  resetContainer();
});

describe('API routes integration', () => {
  it('creates and retrieves a show via Astro endpoints', async () => {
    const createResponse = await createShow({
      request: new Request('http://localhost/api/shows', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Livestream',
          description: 'Endpoint integration',
          startsAt: new Date().toISOString(),
          createdBy: 'producer-42',
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
    } as any);

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();

    const listResponse = await listShows({} as any);
    const listData = await listResponse.json();
    expect(listData.shows).toHaveLength(1);

    const getResponse = await getShow({ params: { id: created.show.id } } as any);
    expect(getResponse.status).toBe(200);
  });

  it('handles optional show fields and missing show lookups', async () => {
    await createShow({
      request: new Request('http://localhost/api/shows', {
        method: 'POST',
        body: JSON.stringify({ title: 'Minimal Show', createdBy: 'producer-99' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    } as any);

    const missingResponse = await getShow({ params: { id: 'unknown-id' } } as any);
    expect(missingResponse.status).toBe(404);
  });

  it('manages raise hand lifecycle through endpoints', async () => {
    const createShowResponse = await createShow({
      request: new Request('http://localhost/api/shows', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Raise Hand Show',
          description: 'Testing raise hand',
          startsAt: new Date().toISOString(),
          createdBy: 'producer-raise',
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
    } as any);
    const { show } = await createShowResponse.json();

    const raiseResponse = await createRaiseHand({
      params: { id: show.id },
      request: new Request('http://localhost/api/shows/id/raise-hand', {
        method: 'POST',
        body: JSON.stringify({ userId: 'guest-raise' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    } as any);
    expect(raiseResponse.status).toBe(201);

    const listResponse = await listRaiseHands({ params: { id: show.id } } as any);
    const data = await listResponse.json();
    expect(data.requests).toHaveLength(1);
  });

  it('handles poll and iso workflows end-to-end', async () => {
    const showResponse = await createShow({
      request: new Request('http://localhost/api/shows', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Poll Show',
          description: 'Poll integration',
          startsAt: new Date().toISOString(),
          createdBy: 'producer-poll',
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
    } as any);
    const { show } = await showResponse.json();

    const pollResponse = await createPoll({
      request: new Request('http://localhost/api/polls', {
        method: 'POST',
        body: JSON.stringify({
          showId: show.id,
          question: 'Pick a mode',
          options: ['LIVE', 'RECORDED'],
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
    } as any);
    const pollData = await pollResponse.json();

    await pollActions({
      params: { id: pollData.poll.id },
      request: new Request('http://localhost/api/polls/id', {
        method: 'POST',
        body: JSON.stringify({ action: 'open' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    } as any);

    await vote({
      params: { id: pollData.poll.id },
      request: new Request('http://localhost/api/polls/id/vote', {
        method: 'POST',
        body: JSON.stringify({ voterKey: 'viewer-1', optionIndex: 0 }),
        headers: { 'Content-Type': 'application/json' },
      }),
    } as any);

    const invalidAction = await pollActions({
      params: { id: pollData.poll.id },
      request: new Request('http://localhost/api/polls/id', {
        method: 'POST',
        body: JSON.stringify({ action: 'unsupported' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    } as any);
    expect(invalidAction.status).toBe(400);

    const results = await pollResults({ params: { id: pollData.poll.id } } as any);
    expect(results.status).toBe(200);

    const manifestResponse = await initIso({
      request: new Request('http://localhost/api/uploads/iso/init', {
        method: 'POST',
        body: JSON.stringify({ showId: show.id, userId: 'guest-1', kind: 'PROGRAM' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    } as any);
    const manifestData = await manifestResponse.json();

    await appendIso({
      params: { id: manifestData.manifest.id },
      request: new Request('http://localhost/api/uploads/iso/id/part', {
        method: 'PUT',
        body: JSON.stringify({ partNo: 0, bytes: 1024, hash: 'hash-0' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    } as any);

    const completeResponse = await completeIso({
      params: { id: manifestData.manifest.id },
      request: new Request('http://localhost/api/uploads/iso/id/complete', {
        method: 'POST',
        body: JSON.stringify({ hash: 'final-hash' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    } as any);
    expect(completeResponse.status).toBe(200);

    const abortManifestResponse = await initIso({
      request: new Request('http://localhost/api/uploads/iso/init', {
        method: 'POST',
        body: JSON.stringify({ showId: show.id, userId: 'guest-2', kind: 'PROGRAM' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    } as any);
    const abortManifest = await abortManifestResponse.json();

    const abortResponse = await abortIso({ params: { id: abortManifest.manifest.id } } as any);
    expect(abortResponse.status).toBe(200);
  });
});
