type AvRecorderEvents = {
  onChunk?: (blob: Blob) => void
  onError?: (err: unknown) => void
  onStop?: () => void
}

export type AvRecorderOptions = {
  audioDeviceId?: string
  videoDeviceId?: string
  width?: number
  height?: number
  frameRate?: number
  timesliceMs?: number
  previewEl?: HTMLVideoElement | null
}

export class AvRecorder {
  private mr: MediaRecorder | null = null
  private stream: MediaStream | null = null

  constructor(private readonly opts: AvRecorderOptions, private readonly events: AvRecorderEvents = {}) {}

  async start(): Promise<void> {
    const constraints: MediaStreamConstraints = {
      audio: this.opts.audioDeviceId ? { deviceId: { exact: this.opts.audioDeviceId } } : true,
      video: {
        deviceId: this.opts.videoDeviceId ? { exact: this.opts.videoDeviceId } : undefined,
        width: this.opts.width ? { ideal: this.opts.width } : undefined,
        height: this.opts.height ? { ideal: this.opts.height } : undefined,
        frameRate: this.opts.frameRate ? { ideal: this.opts.frameRate } : undefined,
      },
    }
    this.stream = await navigator.mediaDevices.getUserMedia(constraints)
    if (this.opts.previewEl) {
      this.opts.previewEl.srcObject = this.stream
      this.opts.previewEl.muted = true
      await this.opts.previewEl.play().catch(() => {})
    }

    const mime = pickVideoMimeType()
    this.mr = new MediaRecorder(this.stream, mime ? { mimeType: mime, videoBitsPerSecond: 4_000_000 } : undefined)
    this.mr.addEventListener('dataavailable', (ev) => {
      if (ev.data && ev.data.size > 0) this.events.onChunk?.(ev.data)
    })
    this.mr.addEventListener('error', (ev) => this.events.onError?.(ev))
    this.mr.addEventListener('stop', () => this.events.onStop?.())

    const timeslice = this.opts.timesliceMs ?? 1000
    this.mr.start(timeslice)
  }

  stop(): void {
    this.mr?.stop()
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
  }
}

export async function listVideoInputs(): Promise<MediaDeviceInfo[]> {
  await navigator.mediaDevices.getUserMedia({ video: true })
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((d) => d.kind === 'videoinput')
}

export async function listAudioInputs(): Promise<MediaDeviceInfo[]> {
  await navigator.mediaDevices.getUserMedia({ audio: true })
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((d) => d.kind === 'audioinput')
}

function pickVideoMimeType(): string | null {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  for (const c of candidates) {
    if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported?.(c)) return c
  }
  return null
}

