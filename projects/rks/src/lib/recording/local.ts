type RecorderEvents = {
  onChunk?: (blob: Blob) => void
  onError?: (err: unknown) => void
  onStop?: () => void
}

export type AudioRecorderOptions = {
  deviceId?: string
  timesliceMs?: number
}

export class AudioRecorder {
  private mr: MediaRecorder | null = null
  private stream: MediaStream | null = null

  constructor(private readonly opts: AudioRecorderOptions, private readonly events: RecorderEvents = {}) {}

  async start(): Promise<void> {
    const constraints: MediaStreamConstraints = {
      audio: this.opts.deviceId ? { deviceId: { exact: this.opts.deviceId } } : true,
      video: false,
    }
    this.stream = await navigator.mediaDevices.getUserMedia(constraints)

    const mime = pickMimeType()
    this.mr = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined)
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

export async function listAudioInputs(): Promise<MediaDeviceInfo[]> {
  await navigator.mediaDevices.getUserMedia({ audio: true })
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((d) => d.kind === 'audioinput')
}

function pickMimeType(): string | null {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ]
  for (const c of candidates) {
    if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported?.(c)) return c
  }
  return null
}

