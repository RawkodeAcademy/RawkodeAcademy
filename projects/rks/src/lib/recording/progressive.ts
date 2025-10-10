import { ChunkAggregator } from './aggregator';
import { IsoUploader, sha256Hex } from './upload';
import { appendPartToManifest, putManifest, updateManifest, type IsoManifestRec } from './store';

export type ProgressiveOpts = {
  targetBytes?: number;
};

export class ProgressiveIsoUploader {
  private readonly iso: IsoUploader;
  private readonly agg: ChunkAggregator;
  private manifestId: string | null = null;
  private seq = 0;
  private total = 0;
  private running = false;

  constructor(private readonly workerBase: string, opts: ProgressiveOpts = {}) {
    this.iso = new IsoUploader(workerBase);
    this.agg = new ChunkAggregator({ targetBytes: opts.targetBytes ?? 16 * 1024 * 1024 });
  }

  async init(meta: { sessionId: string; userId: string; kind: string }): Promise<string> {
    const id = await this.iso.init(meta);
    this.manifestId = id;
    const rec: IsoManifestRec = {
      id,
      sessionId: meta.sessionId,
      userId: meta.userId,
      kind: meta.kind,
      status: 'PENDING',
      totalBytes: 0,
      totalParts: 0,
      hash: null,
      parts: [],
      updatedAt: Date.now(),
    };
    await putManifest(rec);
    this.running = true;
    return id;
  }

  async append(blob: Blob): Promise<void> {
    const chunks = await this.agg.appendAsync(blob);
    for (const ab of chunks) {
      await this.ensureManifest();
      await this.iso.append(ab);
      const bytes = ab.byteLength;
      const hash = await sha256Hex(ab);
      await appendPartToManifest(this.manifestId!, { partNo: this.seq, bytes, hash });
      this.seq += 1;
      this.total += bytes;
    }
  }

  async complete(finalHash: string | null): Promise<void> {
    await this.ensureManifest();
    const tail = this.agg.flush();
    if (tail) {
      await this.iso.append(tail);
      const hash = await sha256Hex(tail);
      await appendPartToManifest(this.manifestId!, { partNo: this.seq, bytes: tail.byteLength, hash });
      this.seq += 1;
      this.total += tail.byteLength;
    }
    await this.iso.complete(finalHash);
    await updateManifest(this.manifestId!, { status: 'COMPLETE', hash: finalHash ?? null });
    this.running = false;
  }

  private async ensureManifest(): Promise<void> {
    if (!this.running || !this.manifestId) throw new Error('progressive uploader not initialised');
  }
}
