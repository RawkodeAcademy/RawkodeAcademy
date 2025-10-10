import { randomUUID } from 'node:crypto';
import { IsoManifest, IsoPart, RecordingStatus, IsoKind } from './types';

export type IsoManifestDraft = Pick<IsoManifest, 'userId' | 'showId' | 'kind'>;

export const createIsoManifest = (draft: IsoManifestDraft): IsoManifest => {
  const createdAt = new Date();
  return IsoManifest.parse({
    id: randomUUID(),
    userId: draft.userId,
    showId: draft.showId,
    kind: draft.kind,
    r2Key: buildManifestKey(draft.showId, draft.userId, draft.kind),
    status: 'PENDING',
    totalBytes: 0,
    totalParts: 0,
    hash: '',
    createdAt,
    updatedAt: createdAt,
  });
};

export const appendIsoPart = (manifest: IsoManifest, partNo: number, bytes: number, hash: string): IsoManifest => {
  if (!['PENDING', 'UPLOADING'].includes(manifest.status)) {
    throw new Error('Manifest is not accepting new parts');
  }
  return {
    ...manifest,
    status: 'UPLOADING',
    totalParts: partNo + 1,
    totalBytes: manifest.totalBytes + bytes,
    updatedAt: new Date(),
    hash,
  };
};

export const finalizeIsoManifest = (manifest: IsoManifest, status: RecordingStatus, hash: string): IsoManifest => {
  if (!['UPLOADING', 'PENDING'].includes(manifest.status)) {
    throw new Error('Manifest already finalised');
  }
  if (!['COMPLETE', 'FAILED'].includes(status)) {
    throw new Error('Final status must be COMPLETE or FAILED');
  }
  return {
    ...manifest,
    status,
    hash,
    updatedAt: new Date(),
  };
};

export const buildManifestKey = (showId: string, userId: string, kind: IsoKind): string => {
  return `iso-uploads/${showId}/${userId}/${kind}/manifest.json`;
};

export const buildPartKey = (manifestId: string, partNo: number): string => {
  return `iso-uploads/${manifestId}/part-${partNo.toString().padStart(4, '0')}`;
};

export const createIsoPart = (manifest: IsoManifest, partNo: number, bytes: number, hash: string): IsoPart => {
  if (partNo < 0) {
    throw new Error('Part number must be positive');
  }
  return IsoPart.parse({
    id: randomUUID(),
    manifestId: manifest.id,
    partNo,
    bytes,
    hash,
    status: 'UPLOADING',
  });
};
