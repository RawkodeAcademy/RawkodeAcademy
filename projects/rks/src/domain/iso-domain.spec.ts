import { describe, expect, it } from 'vitest';
import {
  appendIsoPart,
  buildManifestKey,
  buildPartKey,
  createIsoManifest,
  createIsoPart,
  finalizeIsoManifest,
} from './iso-domain';

describe('iso domain', () => {
  it('creates manifest with deterministic key', () => {
    const manifest = createIsoManifest({ showId: 'show-1', userId: 'user-1', kind: 'AUDIO' });
    expect(manifest.r2Key).toBe(buildManifestKey('show-1', 'user-1', 'AUDIO'));
  });

  it('appends parts and finalises manifest', () => {
    let manifest = createIsoManifest({ showId: 'show-1', userId: 'user-1', kind: 'VIDEO' });
    manifest = appendIsoPart(manifest, 0, 512, 'hash-0');
    expect(manifest.totalBytes).toBe(512);
    const part = createIsoPart(manifest, 1, 256, 'hash-1');
    expect(part.partNo).toBe(1);
    manifest = appendIsoPart(manifest, part.partNo, part.bytes, part.hash);
    const finalised = finalizeIsoManifest(manifest, 'COMPLETE', 'final');
    expect(finalised.status).toBe('COMPLETE');
  });

  it('validates part numbers and final states', () => {
    const manifest = createIsoManifest({ showId: 'show-2', userId: 'user-2', kind: 'PROGRAM' });
    expect(() => createIsoPart(manifest, -1, 10, 'hash')).toThrow('Part number must be positive');
    const uploading = appendIsoPart(manifest, 0, 64, 'hash');
    expect(() => appendIsoPart({ ...uploading, status: 'COMPLETE' }, 1, 32, 'hash')).toThrow(
      'Manifest is not accepting new parts',
    );
    expect(() => finalizeIsoManifest(uploading, 'PENDING' as any, 'hash')).toThrow(
      'Final status must be COMPLETE or FAILED',
    );
    const complete = finalizeIsoManifest(uploading, 'COMPLETE', 'hash');
    expect(() => finalizeIsoManifest(complete, 'COMPLETE', 'hash')).toThrow('Manifest already finalised');
  });

  it('builds part keys with padded part number', () => {
    expect(buildPartKey('manifest-1', 2)).toBe('iso-uploads/manifest-1/part-0002');
  });
});
