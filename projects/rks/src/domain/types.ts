import { z } from 'zod';

export const Identifier = z.string().min(1, 'Identifier must be provided');

export const Role = z.enum(['PRODUCER', 'GUEST', 'VIEWER']);
export type Role = z.infer<typeof Role>;

export const ShowStatus = z.enum(['DRAFT', 'SCHEDULED', 'LIVE', 'ENDED']);
export type ShowStatus = z.infer<typeof ShowStatus>;

export const RecordingStatus = z.enum(['PENDING', 'UPLOADING', 'COMPLETE', 'FAILED']);
export type RecordingStatus = z.infer<typeof RecordingStatus>;

export const RaiseHandStatus = z.enum(['OPEN', 'ACCEPTED', 'REJECTED']);
export type RaiseHandStatus = z.infer<typeof RaiseHandStatus>;

export const PollStatus = z.enum(['DRAFT', 'OPEN', 'CLOSED']);
export type PollStatus = z.infer<typeof PollStatus>;

export const IsoKind = z.enum(['AUDIO', 'VIDEO', 'SCREEN', 'PROGRAM']);
export type IsoKind = z.infer<typeof IsoKind>;

export const User = z.object({
  id: Identifier,
  atprotoDid: z.string().min(1, 'DID is required'),
  role: Role,
  createdAt: z.date(),
});
export type User = z.infer<typeof User>;

export const Show = z.object({
  id: Identifier,
  title: z.string().min(1, 'Title is required'),
  startsAt: z.date(),
  description: z.string().default(''),
  createdBy: Identifier,
  status: ShowStatus,
  createdAt: z.date(),
});
export type Show = z.infer<typeof Show>;

export const Scene = z.object({
  id: Identifier,
  showId: Identifier,
  name: z.string().min(1, 'Scene name is required'),
  config: z.record(z.unknown()).default({}),
});
export type Scene = z.infer<typeof Scene>;

export const Participant = z.object({
  id: Identifier,
  showId: Identifier,
  userId: Identifier,
  role: Role,
  status: z.enum(['INVITED', 'JOINED', 'LEFT']),
});
export type Participant = z.infer<typeof Participant>;

export const Session = z.object({
  id: Identifier,
  showId: Identifier,
  userId: Identifier,
  rtkSessionId: Identifier,
  createdAt: z.date(),
  endedAt: z.date().nullable(),
});
export type Session = z.infer<typeof Session>;

export const Track = z.object({
  id: Identifier,
  showId: Identifier,
  ownerSessionId: Identifier,
  type: z.enum(['PROGRAM', 'ISO', 'SCREEN']),
  rtkTrackId: Identifier,
  createdAt: z.date(),
  endedAt: z.date().nullable(),
});
export type Track = z.infer<typeof Track>;

export const ProgramRecording = z.object({
  id: Identifier,
  showId: Identifier,
  status: RecordingStatus,
  r2Key: z.string().min(1, 'R2 key required'),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ProgramRecording = z.infer<typeof ProgramRecording>;

export const IsoManifest = z.object({
  id: Identifier,
  userId: Identifier,
  showId: Identifier,
  kind: IsoKind,
  r2Key: z.string(),
  status: RecordingStatus,
  totalBytes: z.number().nonnegative(),
  totalParts: z.number().int().nonnegative(),
  hash: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type IsoManifest = z.infer<typeof IsoManifest>;

export const IsoPart = z.object({
  id: Identifier,
  manifestId: Identifier,
  partNo: z.number().int().nonnegative(),
  bytes: z.number().nonnegative(),
  hash: z.string(),
  status: RecordingStatus,
});
export type IsoPart = z.infer<typeof IsoPart>;

export const RaiseHandRequest = z.object({
  id: Identifier,
  showId: Identifier,
  userId: Identifier,
  status: RaiseHandStatus,
  createdAt: z.date(),
});
export type RaiseHandRequest = z.infer<typeof RaiseHandRequest>;

export const Poll = z.object({
  id: Identifier,
  showId: Identifier,
  question: z.string().min(1, 'Question required'),
  options: z.array(z.string().min(1)).min(2, 'Poll requires at least two options'),
  status: PollStatus,
  createdAt: z.date(),
});
export type Poll = z.infer<typeof Poll>;

export const PollVote = z.object({
  id: Identifier,
  pollId: Identifier,
  voterKey: z.string().min(1, 'Voter key required'),
  optionIndex: z.number().int().nonnegative(),
  createdAt: z.date(),
});
export type PollVote = z.infer<typeof PollVote>;

export const Envelope = z.object({
  v: z.literal(1),
  type: z.string(),
  ts: z.number().int(),
  seq: z.number().int().nonnegative(),
  roomId: Identifier,
  payload: z.unknown(),
});
export type Envelope = z.infer<typeof Envelope>;

export type Identifier = z.infer<typeof Identifier>;
