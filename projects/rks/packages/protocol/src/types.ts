import { z } from 'zod';

export const ParticipantRoleSchema = z.enum(['producer', 'guest', 'viewer']);
export type ParticipantRole = z.infer<typeof ParticipantRoleSchema>;

export const TrackTypeSchema = z.enum(['program', 'camera', 'microphone', 'screen', 'media']);
export type TrackType = z.infer<typeof TrackTypeSchema>;

export const TrackStateSchema = z.object({
  id: z.string().min(1, 'track id required'),
  type: TrackTypeSchema,
  rid: z.enum(['f', 'h', 'q']).optional(),
  isMuted: z.boolean().default(false),
  isVisible: z.boolean().default(true),
});
export type TrackState = z.infer<typeof TrackStateSchema>;

export const ParticipantStateSchema = z.object({
  id: z.string().min(1, 'participant id required'),
  displayName: z.string().min(1, 'display name required'),
  role: ParticipantRoleSchema,
  tracks: z.array(TrackStateSchema).default([]),
  raisedHand: z.boolean().default(false),
});
export type ParticipantState = z.infer<typeof ParticipantStateSchema>;

export const SceneLayerSchema = z.object({
  id: z.string().min(1, 'layer id required'),
  kind: z.enum(['program', 'media', 'participant', 'whiteboard']),
  targetId: z.string().min(1, 'target id required'),
  options: z
    .object({
      position: z.tuple([z.number().min(0), z.number().min(0)]).default([0, 0]),
      size: z.tuple([z.number().positive(), z.number().positive()]).default([1, 1]),
      opacity: z.number().min(0).max(1).default(1),
      isMirrored: z.boolean().default(false),
    })
    .partial()
    .default({}),
});
export type SceneLayer = z.infer<typeof SceneLayerSchema>;

export const SceneStateSchema = z.object({
  id: z.string().min(1, 'scene id required'),
  name: z.string().min(1, 'scene name required'),
  layout: z.enum(['grid', 'picture-in-picture', 'solo', 'custom']).default('grid'),
  layers: z.array(SceneLayerSchema).default([]),
  updatedAt: z.string().datetime(),
});
export type SceneState = z.infer<typeof SceneStateSchema>;

export const PollStatusSchema = z.enum(['draft', 'open', 'closed']);
export type PollStatus = z.infer<typeof PollStatusSchema>;

export const PollStateSchema = z.object({
  id: z.string().min(1, 'poll id required'),
  question: z.string().min(1, 'question required'),
  options: z.array(z.string().min(1)).min(2),
  status: PollStatusSchema,
  responses: z.array(z.number().int().min(0)).optional(),
});
export type PollState = z.infer<typeof PollStateSchema>;

export const CommentPinSchema = z.object({
  id: z.string().min(1, 'comment id required'),
  message: z.string().min(1, 'message required'),
  authorDisplayName: z.string().min(1, 'author required'),
  pinnedAt: z.string().datetime(),
});
export type CommentPin = z.infer<typeof CommentPinSchema>;

export const WhiteboardStateSchema = z
  .object({
    isActive: z.boolean(),
    url: z.string().url().nullable().default(null),
    ownerId: z.string().min(1).nullable().default(null),
    updatedAt: z.string().datetime(),
  })
  .superRefine((value, ctx) => {
    if (value.isActive && !value.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'active whiteboard requires url',
        path: ['url'],
      });
    }
  });
export type WhiteboardState = z.infer<typeof WhiteboardStateSchema>;

export const StateDeltaSchema = z.object({
  version: z.number().int().min(1),
  roomId: z.string().min(1, 'room id required'),
  showId: z.string().min(1, 'show id required'),
  activeSceneId: z.string().nullable(),
  participants: z.array(ParticipantStateSchema),
  scenes: z.array(SceneStateSchema),
  polls: z.array(PollStateSchema),
  pinnedComment: CommentPinSchema.nullable(),
  whiteboard: WhiteboardStateSchema,
  updatedAt: z.string().datetime(),
});
export type StateDelta = z.infer<typeof StateDeltaSchema>;

export const SceneUpdateSchema = z.object({
  sceneId: z.string().min(1, 'scene id required'),
  name: z.string().min(1).optional(),
  layout: z.enum(['grid', 'picture-in-picture', 'solo', 'custom']).optional(),
  layers: z.array(SceneLayerSchema).optional(),
  updatedAt: z.string().datetime(),
});
export type SceneUpdate = z.infer<typeof SceneUpdateSchema>;

export const GridCellSchema = z.object({
  slot: z.number().int().min(0),
  participantId: z.string().min(1, 'participant id required'),
  trackId: z.string().min(1, 'track id required'),
});
export type GridCell = z.infer<typeof GridCellSchema>;

export const GridUpdateSchema = z.object({
  sceneId: z.string().min(1, 'scene id required'),
  layout: z.enum(['grid', 'picture-in-picture', 'solo', 'custom']),
  cells: z.array(GridCellSchema),
  updatedAt: z.string().datetime(),
});
export type GridUpdate = z.infer<typeof GridUpdateSchema>;

export const PollOpenSchema = z.object({
  poll: PollStateSchema.extend({
    status: z.literal('open'),
    responses: z.array(z.number().int().min(0)).optional(),
  }),
  openedAt: z.string().datetime(),
});
export type PollOpen = z.infer<typeof PollOpenSchema>;

export const PollUpdateSchema = z.object({
  pollId: z.string().min(1, 'poll id required'),
  counts: z.array(z.number().int().min(0)).nonempty(),
  totalVotes: z.number().int().min(0),
  updatedAt: z.string().datetime(),
});
export type PollUpdate = z.infer<typeof PollUpdateSchema>;

export const EnvelopeTypeSchema = z.enum([
  'state.delta',
  'scene.update',
  'grid.update',
  'poll.open',
  'poll.update',
  'comment.pin',
  'whiteboard.state',
]);
export type EnvelopeType = z.infer<typeof EnvelopeTypeSchema>;

export const EnvelopePayloadSchemas: Record<EnvelopeType, z.ZodTypeAny> = {
  'state.delta': StateDeltaSchema,
  'scene.update': SceneUpdateSchema,
  'grid.update': GridUpdateSchema,
  'poll.open': PollOpenSchema,
  'poll.update': PollUpdateSchema,
  'comment.pin': CommentPinSchema,
  'whiteboard.state': WhiteboardStateSchema,
};

export const EnvelopeSchema = z.object({
  v: z.literal(1),
  type: EnvelopeTypeSchema,
  ts: z.number().int().nonnegative(),
  seq: z.number().int().nonnegative(),
  roomId: z.string().min(1, 'room id required'),
  payload: z.union([
    StateDeltaSchema,
    SceneUpdateSchema,
    GridUpdateSchema,
    PollOpenSchema,
    PollUpdateSchema,
    CommentPinSchema,
    WhiteboardStateSchema,
  ]),
});
export type Envelope = z.infer<typeof EnvelopeSchema>;

export function parseEnvelope(input: unknown): Envelope {
  const envelope = EnvelopeSchema.parse(input);
  const payloadSchema = EnvelopePayloadSchemas[envelope.type];
  payloadSchema.parse(envelope.payload);
  return envelope;
}

export function makeEnvelope<TType extends EnvelopeType>(
  type: TType,
  payload: z.infer<(typeof EnvelopePayloadSchemas)[TType]>,
  metadata: { v?: 1; ts: number; seq: number; roomId: string },
): Envelope {
  const base = {
    v: 1 as const,
    type,
    ts: metadata.ts,
    seq: metadata.seq,
    roomId: metadata.roomId,
    payload,
  } satisfies Envelope;
  return EnvelopeSchema.parse(base);
}
