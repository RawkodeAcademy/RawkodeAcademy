export type TestPatternOptions = {
  width?: number
  height?: number
  fps?: number
  tone?: boolean
}

export function createTestPatternStream(opts: TestPatternOptions = {}): { stream: MediaStream; stop: () => void } {
  const width = opts.width ?? 1280
  const height = opts.height ?? 720
  const fps = opts.fps ?? 30
  const tone = opts.tone ?? false

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  let raf = 0
  let running = true
  let t = 0
  const draw = () => {
    if (!running) return
    // simple color bars + moving block
    const bars = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff']
    const barW = Math.ceil(width / bars.length)
    bars.forEach((c, i) => {
      ctx.fillStyle = c
      ctx.fillRect(i * barW, 0, barW, height)
    })
    // moving block
    const bx = Math.floor(((Math.sin(t / 15) + 1) / 2) * (width - 120))
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(bx, height - 120, 120, 100)
    ctx.fillStyle = '#ffffff'
    ctx.font = '20px system-ui, sans-serif'
    ctx.fillText('DEV PROGRAM (fallback)', bx + 10, height - 50)
    t++
    raf = requestAnimationFrame(draw)
  }
  raf = requestAnimationFrame(draw)

  const videoStream = (canvas as any).captureStream?.(fps) as MediaStream

  let dest: MediaStreamAudioDestinationNode | null = null
  let osc: OscillatorNode | null = null
  if (tone) {
    const ac = new (window.AudioContext || (window as any).webkitAudioContext)()
    dest = ac.createMediaStreamDestination()
    osc = ac.createOscillator()
    osc.frequency.value = 440
    osc.connect(dest)
    osc.start()
  }

  const stream = new MediaStream()
  if (videoStream) {
    const vt = videoStream.getVideoTracks()[0]
    if (vt) stream.addTrack(vt)
  }
  if (dest) {
    const at = dest.stream.getAudioTracks()[0]
    if (at) stream.addTrack(at)
  }

  const stop = () => {
    running = false
    cancelAnimationFrame(raf)
    try { osc?.stop() } catch {}
    stream.getTracks().forEach((t) => t.stop())
  }

  return { stream, stop }
}

