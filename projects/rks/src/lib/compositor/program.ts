export type ProgramLayout = 'camera' | 'pip' | 'grid2';

export type ProgramCompositorOptions = {
  width?: number;
  height?: number;
  fps?: number;
};

type SourceKind = 'camera' | 'screen';

export class ProgramCompositor {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly fps: number;
  private videoEls: Record<SourceKind, HTMLVideoElement | null> = { camera: null, screen: null };
  private audioCtx: AudioContext | null = null;
  private dest: MediaStreamAudioDestinationNode | null = null;
  private audioSources: Record<SourceKind, MediaStreamAudioSourceNode | null> = { camera: null, screen: null };
  private gains: Record<SourceKind, GainNode | null> = { camera: null, screen: null };
  private raf = 0;
  private running = false;
  private layout: ProgramLayout = 'pip';
  private outStream: MediaStream;

  constructor(opts: ProgramCompositorOptions = {}) {
    const width = opts.width ?? 1920;
    const height = opts.height ?? 1080;
    this.fps = opts.fps ?? 30;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
    // Create output stream (video from canvas)
    const cap = (this.canvas as any).captureStream?.(this.fps) as MediaStream | undefined;
    this.outStream = new MediaStream();
    if (cap) {
      const vt = cap.getVideoTracks()[0];
      if (vt) this.outStream.addTrack(vt);
    }
  }

  setLayout(layout: ProgramLayout) {
    this.layout = layout;
  }

  setCamera(stream: MediaStream | null) {
    this.attachSource('camera', stream);
  }

  setScreen(stream: MediaStream | null) {
    this.attachSource('screen', stream);
  }

  getStream(): MediaStream {
    return this.outStream;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    try { this.audioCtx?.close(); } catch {}
    this.audioCtx = null;
    this.dest = null;
    this.audioSources = { camera: null, screen: null };
    this.gains = { camera: null, screen: null };
    // Remove audio track from outStream
    this.outStream.getAudioTracks().forEach((t) => this.outStream.removeTrack(t));
  }

  private attachSource(kind: SourceKind, stream: MediaStream | null) {
    // Video element management
    if (!stream) {
      if (this.videoEls[kind]) {
        this.videoEls[kind]!.srcObject = null;
      }
      this.videoEls[kind] = null;
    } else {
      const el = document.createElement('video');
      el.playsInline = true as any;
      el.muted = true;
      (el as any).srcObject = stream;
      // Best effort play; ignore failures (autoplay policies)
      el.play?.().catch(() => {});
      this.videoEls[kind] = el;
    }

    // Audio mixing
    const aTrack = stream?.getAudioTracks?.()[0] || null;
    if (!aTrack) {
      // remove existing source
      const g = this.gains[kind];
      try { g?.disconnect(); } catch {}
      this.gains[kind] = null;
      this.audioSources[kind] = null;
      this.refreshAudioOutputTrack();
    } else {
      if (!this.audioCtx) this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!this.dest) this.dest = this.audioCtx.createMediaStreamDestination();
      const src = this.audioCtx.createMediaStreamSource(new MediaStream([aTrack]));
      const gain = this.audioCtx.createGain();
      gain.gain.value = 1.0;
      src.connect(gain).connect(this.dest);
      this.audioSources[kind] = src;
      this.gains[kind] = gain;
      this.refreshAudioOutputTrack();
    }
  }

  private refreshAudioOutputTrack() {
    // Remove old
    this.outStream.getAudioTracks().forEach((t) => this.outStream.removeTrack(t));
    if (this.dest) {
      const at = this.dest.stream.getAudioTracks()[0];
      if (at) this.outStream.addTrack(at);
    }
  }

  private loop = () => {
    if (!this.running) return;
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    // Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const cam = this.videoEls.camera;
    const scr = this.videoEls.screen;

    switch (this.layout) {
      case 'camera':
        if (cam) this.drawContain(cam, 0, 0, width, height);
        break;
      case 'grid2': {
        const sources = [cam, scr].filter(Boolean) as HTMLVideoElement[];
        const cols = 2; const rows = 1; // simple 2-up
        const tileW = Math.floor(width / cols);
        const tileH = Math.floor(height / rows);
        sources.forEach((vid, i) => {
          const x = (i % cols) * tileW;
          const y = Math.floor(i / cols) * tileH;
          this.drawContain(vid, x, y, tileW, tileH);
        });
        break;
      }
      case 'pip':
      default: {
        // screen as base, camera as inset
        if (scr) this.drawCover(scr, 0, 0, width, height);
        const insetW = Math.floor(width * 0.28);
        const insetH = Math.floor(insetW * 9 / 16);
        const margin = Math.floor(width * 0.02);
        const x = width - insetW - margin;
        const y = height - insetH - margin;
        if (cam) {
          // shadow + border
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x - 4, y - 4, insetW + 8, insetH + 8);
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x - 1, y - 1, insetW + 2, insetH + 2);
          this.drawCover(cam, x, y, insetW, insetH);
        }
        break;
      }
    }

    this.raf = requestAnimationFrame(this.loop);
  };

  private drawContain(video: HTMLVideoElement, dx: number, dy: number, dw: number, dh: number) {
    const vw = video.videoWidth || 16;
    const vh = video.videoHeight || 9;
    const s = Math.min(dw / vw, dh / vh);
    const rw = Math.floor(vw * s);
    const rh = Math.floor(vh * s);
    const ox = dx + Math.floor((dw - rw) / 2);
    const oy = dy + Math.floor((dh - rh) / 2);
    this.ctx.drawImage(video, ox, oy, rw, rh);
  }

  private drawCover(video: HTMLVideoElement, dx: number, dy: number, dw: number, dh: number) {
    const vw = video.videoWidth || 16;
    const vh = video.videoHeight || 9;
    const s = Math.max(dw / vw, dh / vh);
    const rw = Math.floor(vw * s);
    const rh = Math.floor(vh * s);
    const ox = dx + Math.floor((dw - rw) / 2);
    const oy = dy + Math.floor((dh - rh) / 2);
    this.ctx.drawImage(video, ox, oy, rw, rh);
  }
}

