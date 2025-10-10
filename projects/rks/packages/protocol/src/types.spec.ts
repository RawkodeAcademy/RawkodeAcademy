import { describe, expect, it } from 'vitest';
import {
  CommentPinSchema,
  EnvelopePayloadSchemas,
  EnvelopeSchema,
  GridUpdateSchema,
  ParticipantStateSchema,
  PollOpenSchema,
  PollStateSchema,
  PollUpdateSchema,
  SceneLayerSchema,
  SceneUpdateSchema,
  StateDeltaSchema,
  WhiteboardStateSchema,
  makeEnvelope,
  parseEnvelope,
} from './types.js';

const isoTimestamp = () => new Date().toISOString();

describe('protocol schemas', () => {
  it('validates a full state delta', () => {
    const result = StateDeltaSchema.safeParse({
      version: 1,
      roomId: 'room-123',
      showId: 'show-abc',
      activeSceneId: 'scene-main',
      participants: [
        {
          id: 'participant-1',
          displayName: 'Producer Pat',
          role: 'producer',
          tracks: [
            { id: 'track-program', type: 'program', isMuted: false, isVisible: true },
            { id: 'track-camera', type: 'camera', rid: 'f', isMuted: false, isVisible: true },
          ],
          raisedHand: false,
        },
      ],
      scenes: [
        {
          id: 'scene-main',
          name: 'Main',
          layout: 'grid',
          layers: [
            { id: 'layer-program', kind: 'program', targetId: 'track-program', options: { opacity: 1 } },
          ],
          updatedAt: isoTimestamp(),
        },
      ],
      polls: [
        {
          id: 'poll-1',
          question: 'Which feature next?',
          options: ['chat', 'polls'],
          status: 'open',
          responses: [10, 15],
        },
      ],
      pinnedComment: {
        id: 'comment-1',
        message: 'Welcome everyone!',
        authorDisplayName: 'Host',
        pinnedAt: isoTimestamp(),
      },
      whiteboard: {
        isActive: true,
        url: 'https://whiteboard.example/room',
        ownerId: 'participant-1',
        updatedAt: isoTimestamp(),
      },
      updatedAt: isoTimestamp(),
    });

    expect(result.success).toBe(true);
  });

  it('rejects active whiteboard without url', () => {
    const result = WhiteboardStateSchema.safeParse({
      isActive: true,
      url: null,
      ownerId: 'user-1',
      updatedAt: isoTimestamp(),
    });

    expect(result.success).toBe(false);
  });

  it('enforces poll option minimum', () => {
    const result = PollStateSchema.safeParse({
      id: 'poll-1',
      question: 'Pick one',
      options: ['only'],
      status: 'draft',
    });

    expect(result.success).toBe(false);
  });

  it('validates scene updates with optional layers', () => {
    const result = SceneUpdateSchema.safeParse({
      sceneId: 'scene-main',
      name: 'Main Scene',
      layout: 'solo',
      updatedAt: isoTimestamp(),
    });

    expect(result.success).toBe(true);
  });

  it('prevents invalid layer coordinates', () => {
    const result = SceneLayerSchema.safeParse({
      id: 'layer-1',
      kind: 'participant',
      targetId: 'participant-1',
      options: { position: [0, -1] },
    });

    expect(result.success).toBe(false);
  });

  it('validates grid update cells', () => {
    const result = GridUpdateSchema.safeParse({
      sceneId: 'scene-main',
      layout: 'grid',
      cells: [
        { slot: 0, participantId: 'participant-1', trackId: 'track-program' },
        { slot: 1, participantId: 'participant-2', trackId: 'track-camera' },
      ],
      updatedAt: isoTimestamp(),
    });

    expect(result.success).toBe(true);
  });

  it('requires matching envelope payload schema', () => {
    const envelope = makeEnvelope('poll.open', {
      poll: {
        id: 'poll-1',
        question: 'Next?',
        options: ['A', 'B'],
        status: 'open',
        responses: [0, 0],
      },
      openedAt: isoTimestamp(),
    }, { roomId: 'room', seq: 1, ts: Date.now() });

    expect(envelope.type).toBe('poll.open');
    expect(() => parseEnvelope({ ...envelope, type: 'grid.update' })).toThrowError();
  });

  it('exposes schema registry for runtime pairing', () => {
    expect(Object.keys(EnvelopePayloadSchemas)).toEqual([
      'state.delta',
      'scene.update',
      'grid.update',
      'poll.open',
      'poll.update',
      'comment.pin',
      'whiteboard.state',
    ]);
  });

  it('validates comment pin payload', () => {
    const result = CommentPinSchema.safeParse({
      id: 'pin-1',
      message: 'Check this out',
      authorDisplayName: 'Producer Pat',
      pinnedAt: isoTimestamp(),
    });

    expect(result.success).toBe(true);
  });

  it('requires participants to include display names', () => {
    const result = ParticipantStateSchema.safeParse({
      id: 'participant-1',
      displayName: '',
      role: 'producer',
      tracks: [],
      raisedHand: false,
    });

    expect(result.success).toBe(false);
  });

  it('validates poll update totals', () => {
    const result = PollUpdateSchema.safeParse({
      pollId: 'poll-1',
      counts: [1, 2, 3],
      totalVotes: 6,
      updatedAt: isoTimestamp(),
    });

    expect(result.success).toBe(true);
  });
});
