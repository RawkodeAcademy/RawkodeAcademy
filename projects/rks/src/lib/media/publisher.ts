export type RtpRid = 'f' | 'h' | 'q'
export type PublisherOptions = {
  camera: boolean
  microphone: boolean
  simulcast?: boolean
  workerBase?: string | null
  appSessionId?: string
  // Device preferences
  audioDeviceId?: string
  videoDeviceId?: string
  // Audio processing
  echoCancellation?: boolean
  noiseSuppression?: boolean
  autoGainControl?: boolean
  // Video prefs
  width?: number
  height?: number
  frameRate?: number
}

export class Publisher {
  private pc: RTCPeerConnection
  private localStreams: MediaStream[] = []
  private rtkSessionId: string | null = null

  constructor(private readonly opts: PublisherOptions) {
    this.pc = new RTCPeerConnection({
      // ICE servers will be set during negotiation via setConfiguration if provided by Worker
    })
  }

  async start(): Promise<void> {
    if (this.opts.camera || this.opts.microphone) {
      const video: MediaTrackConstraints | false = this.opts.camera
        ? {
            deviceId: this.opts.videoDeviceId ? { exact: this.opts.videoDeviceId } : undefined,
            width: this.opts.width ? { ideal: this.opts.width } : { ideal: 1920 },
            height: this.opts.height ? { ideal: this.opts.height } : { ideal: 1080 },
            frameRate: this.opts.frameRate ? { ideal: this.opts.frameRate } : { ideal: 30 },
          }
        : false
      const audio: MediaTrackConstraints | false = this.opts.microphone
        ? {
            deviceId: this.opts.audioDeviceId ? { exact: this.opts.audioDeviceId } : undefined,
            echoCancellation: this.opts.echoCancellation ?? true,
            noiseSuppression: this.opts.noiseSuppression ?? true,
            autoGainControl: this.opts.autoGainControl ?? true,
          }
        : false
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio })
      this.localStreams.push(stream)

      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        const sendEncodings = this.opts.simulcast
          ? [
              { rid: 'q', maxBitrate: 350_000, scaleResolutionDownBy: 4 },
              { rid: 'h', maxBitrate: 1_200_000, scaleResolutionDownBy: 2 },
              { rid: 'f', maxBitrate: 3_000_000, scaleResolutionDownBy: 1 },
            ]
          : undefined
        this.pc.addTransceiver(videoTrack, { direction: 'sendonly', ...(sendEncodings ? { sendEncodings } as any : {}) })
      }
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) this.pc.addTransceiver(audioTrack, { direction: 'sendonly' })
    }
  }

  async addScreenShare(stream: MediaStream): Promise<void> {
    const track = stream.getVideoTracks()[0]
    if (!track) return
    this.pc.addTransceiver(track, { direction: 'sendonly' })
  }

  async negotiate(): Promise<void> {
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)

    if (!this.opts.workerBase) return
    // Step 1: create RTK session if needed
    if (!this.rtkSessionId) {
      const res = await fetch(`${this.opts.workerBase}/rtk/create-session`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'publisher', ownerSessionId: this.opts.appSessionId || null })
      })
      if (!res.ok) throw new Error(`rtk create-session failed: ${res.status}`)
      const js = await res.json()
      this.rtkSessionId = js.rtkSessionId || null
      if (Array.isArray(js.iceServers)) this.pc.setConfiguration({ iceServers: js.iceServers })
    }
    if (!this.rtkSessionId) return
    // Step 2: negotiate via tracks/new
    const res2 = await fetch(`${this.opts.workerBase}/rtk/sessions/${this.rtkSessionId}/tracks/new`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sdp: offer.sdp, meta: { type: 'PROGRAM', ownerSessionId: this.opts.appSessionId || 'unknown', location: 'local' } })
    })
    if (!res2.ok) throw new Error(`rtk tracks/new failed: ${res2.status}`)
    const data = await res2.json()
    if (Array.isArray(data.iceServers)) this.pc.setConfiguration({ iceServers: data.iceServers })
    if (data.sdp) await this.pc.setRemoteDescription({ type: 'answer', sdp: data.sdp })
  }

  async stop(): Promise<void> {
    for (const s of this.localStreams) s.getTracks().forEach((t) => t.stop())
    this.localStreams = []
    this.pc.getSenders().forEach((s) => s.track && s.track.stop())
    this.pc.close()
  }

  private async configureSimulcast(_: RTCRtpSender) {}
}

export async function createPublisher(opts: PublisherOptions): Promise<Publisher> {
  const pub = new Publisher({ simulcast: true, ...opts })
  await pub.start()
  return pub
}
