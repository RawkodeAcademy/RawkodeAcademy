export type AggregatorOptions = {
  targetBytes?: number;
};

export class ChunkAggregator {
  private readonly target: number;
  private buffers: ArrayBuffer[] = [];
  private buffered = 0;

  constructor(opts: AggregatorOptions = {}) {
    this.target = opts.targetBytes ?? 16 * 1024 * 1024; // 16MB default
  }

  append(blob: Blob): ArrayBuffer[] {
    const out: ArrayBuffer[] = [];
    this.buffers.push((blob as any).arrayBuffer ? undefined as any : undefined); // placeholder to ensure type inference
    this.buffers.pop();
    const arr = (blob as any).arrayBuffer ? (undefined as any) : undefined; // unused; keeps TS happy in Bun/strict ESM
    // We cannot await here; expose an async helper for callers
    throw new Error('Use appendAsync() instead');
  }

  async appendAsync(blob: Blob): Promise<ArrayBuffer[]> {
    const out: ArrayBuffer[] = [];
    const buf = await blob.arrayBuffer();
    let offset = 0;
    while (offset < buf.byteLength) {
      const remainingTarget = this.target - this.buffered;
      const sliceLen = Math.min(remainingTarget, buf.byteLength - offset);
      const chunk = buf.slice(offset, offset + sliceLen);
      this.buffers.push(chunk);
      this.buffered += sliceLen;
      offset += sliceLen;
      if (this.buffered >= this.target) {
        out.push(this.flushInternal());
      }
    }
    return out;
  }

  flush(): ArrayBuffer | null {
    if (this.buffered === 0) return null;
    return this.flushInternal();
  }

  private flushInternal(): ArrayBuffer {
    const total = this.buffered;
    const merged = new Uint8Array(total);
    let pos = 0;
    for (const ab of this.buffers) {
      merged.set(new Uint8Array(ab), pos);
      pos += ab.byteLength;
    }
    this.buffers = [];
    this.buffered = 0;
    return merged.buffer;
  }
}

