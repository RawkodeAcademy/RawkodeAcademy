export type IsoInitRequest = { sessionId: string; userId: string; kind: string }
export type IsoInitResponse = { manifest: { id: string; status: string } }

export class IsoUploader {
  private partNo = 0
  private manifestId: string | null = null
  private aborted = false

  constructor(private readonly workerBase: string) {}

  async init(req: IsoInitRequest): Promise<string> {
    const res = await fetch(`${this.workerBase}/uploads/iso/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
    if (!res.ok) throw new Error(`iso init failed: ${res.status}`)
    const json = (await res.json()) as IsoInitResponse
    this.manifestId = json.manifest.id
    this.partNo = 0
    this.aborted = false
    return this.manifestId
  }

  async append(chunk: Blob | ArrayBuffer): Promise<void> {
    if (!this.manifestId) throw new Error('manifest not initialised')
    if (this.aborted) throw new Error('uploader aborted')
    const body = chunk instanceof Blob ? await chunk.arrayBuffer() : chunk
    const hash = await sha256Hex(body)
    const res = await fetch(`${this.workerBase}/uploads/iso/${this.manifestId}/part`, {
      method: 'PUT',
      headers: {
        'x-part-no': String(this.partNo),
        'x-content-sha256': hash,
      },
      body,
    })
    if (!res.ok) throw new Error(`append failed: ${res.status}`)
    this.partNo += 1
  }

  async complete(finalHash?: string | null): Promise<void> {
    if (!this.manifestId) return
    const res = await fetch(`${this.workerBase}/uploads/iso/${this.manifestId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash: finalHash ?? null }),
    })
    if (!res.ok) throw new Error(`complete failed: ${res.status}`)
  }

  async abort(): Promise<void> {
    if (!this.manifestId) return
    this.aborted = true
    await fetch(`${this.workerBase}/uploads/iso/${this.manifestId}/abort`, { method: 'POST' })
  }
}

export async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buf)
  const arr = Array.from(new Uint8Array(digest))
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('')
}
