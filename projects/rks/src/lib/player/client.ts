export type ViewerOptions = {
  workerBase?: string | null
  videoEl: HTMLVideoElement
}

export class ViewerClient {
  private pc: RTCPeerConnection
  private rtkSessionId: string | null = null

  constructor(private readonly opts: ViewerOptions) {
    this.pc = new RTCPeerConnection()
    this.pc.addEventListener('track', (ev) => {
      const [stream] = ev.streams
      if (stream && this.opts.videoEl) this.opts.videoEl.srcObject = stream
    })
    this.pc.addTransceiver('video', { direction: 'recvonly' })
    this.pc.addTransceiver('audio', { direction: 'recvonly' })
  }

  async start(programTrackId?: string | null): Promise<void> {
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)
    if (!this.opts.workerBase) return
    // create session
    if (!this.rtkSessionId) {
      const res = await fetch(`${this.opts.workerBase}/rtk/create-session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'viewer' }) })
      if (!res.ok) throw new Error(`rtk create-session failed: ${res.status}`)
      const js = await res.json()
      this.rtkSessionId = js.rtkSessionId || null
      if (Array.isArray(js.iceServers)) this.pc.setConfiguration({ iceServers: js.iceServers })
    }
    if (!this.rtkSessionId) return
    const body: any = { sdp: offer.sdp }
    if (programTrackId) body.meta = { subscribe: [programTrackId], location: 'remote' }
    const res2 = await fetch(`${this.opts.workerBase}/rtk/sessions/${this.rtkSessionId}/tracks/new`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res2.ok) throw new Error(`rtk tracks/new failed: ${res2.status}`)
    const data = await res2.json()
    if (Array.isArray(data.iceServers)) this.pc.setConfiguration({ iceServers: data.iceServers })
    if (data.sdp) await this.pc.setRemoteDescription({ type: 'answer', sdp: data.sdp })
  }

  async setPreferredRid(rid: 'auto' | 'f' | 'h' | 'q') {
    // Placeholder: will call Worker `/tracks/update preferredRid` when implemented
    console.debug('setPreferredRid', rid)
  }
}

export function createViewerClient(opts: ViewerOptions) {
  return new ViewerClient(opts)
}
