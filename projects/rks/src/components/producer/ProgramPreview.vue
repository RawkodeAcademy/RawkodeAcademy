<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { ProgramCompositor, type ProgramLayout } from '../../lib/compositor/program'
import { ProgressiveIsoUploader } from '../../lib/recording/progressive'

const props = defineProps<{
  showId?: string
  workerBase?: string | null
  cameraStream?: MediaStream | null
  screenStream?: MediaStream | null
}>()

const programEl = ref<HTMLVideoElement | null>(null)
const monitor = ref<boolean>(false)
const layout = ref<ProgramLayout>('pip')
let comp: ProgramCompositor | null = null

// Recording state
let mr: MediaRecorder | null = null
let chunks: Blob[] = []
let uploader: ProgressiveIsoUploader | null = null
let uploadedBytes = 0
const progressive = (import.meta.env.PUBLIC_RKS_PROGRESSIVE_UPLOAD as string | undefined) === 'true'
const status = ref<string>('Idle')
const recording = ref<boolean>(false)
const btnDisabled = ref<boolean>(false)
const dlHref = ref<string>('')

function setStatus(s: string) { status.value = s }

function bindStreams() {
  if (!comp) return
  comp.setCamera(props.cameraStream || null)
  comp.setScreen(props.screenStream || null)
}

watch(() => props.cameraStream, () => bindStreams())
watch(() => props.screenStream, () => bindStreams())
watch(layout, (l) => { if (comp) comp.setLayout(l) })

onMounted(() => {
  comp = new ProgramCompositor({ width: 1920, height: 1080, fps: 30 })
  comp.setLayout(layout.value)
  bindStreams()
  comp.start()
  const out = comp.getStream()
  if (programEl.value) {
    ;(programEl.value as any).srcObject = out
    programEl.value.muted = !monitor.value
    programEl.value.play?.().catch(() => {})
  }
})

onUnmounted(() => {
  try { comp?.stop() } catch {}
  comp = null
  if (mr && mr.state !== 'inactive') { try { mr.stop() } catch {} }
  chunks = []
  try { if (dlHref.value) URL.revokeObjectURL(dlHref.value) } catch {}
})

async function startRecord() {
  if (!comp) return
  btnDisabled.value = true
  try {
    const stream = comp.getStream()
    const mime = pickVideoMime()
    mr = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 5_000_000 } : undefined)
    chunks = []

    if (progressive && props.workerBase) {
      uploader = new ProgressiveIsoUploader(props.workerBase, { targetBytes: 16 * 1024 * 1024 })
      // Ensure session exists
      const res = await fetch(props.workerBase + '/sessions', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ title: 'Program Mix', userId: 'producer-local' }) })
      if (!res.ok) throw new Error('Session create failed')
      const js = await res.json(); const sessionId = js.session?.id || 'unknown'
      await uploader.init({ sessionId, userId: 'producer-local', kind: 'PROGRAM' })
      setStatus('Recording program… (progressive)')
    } else {
      setStatus('Recording program locally…')
    }

    mr.addEventListener('dataavailable', async (ev) => {
      if (!ev.data || ev.data.size === 0) return
      if (uploader) {
        await uploader.append(ev.data)
        uploadedBytes += ev.data.size
      } else {
        chunks.push(ev.data)
      }
    })
    mr.addEventListener('stop', async () => {
      if (uploader) {
        try { await uploader.complete(null) } catch {}
        setStatus('Upload complete')
      } else if (chunks.length) {
        const blob = new Blob(chunks, { type: chunks[0]?.type || 'video/webm' })
        try { if (dlHref.value) URL.revokeObjectURL(dlHref.value) } catch {}
        dlHref.value = URL.createObjectURL(blob)
        setStatus('Saved locally')
      }
      recording.value = false
      btnDisabled.value = false
    })

    mr.start(1000)
    recording.value = true
  } catch (e) {
    console.error(e)
    setStatus('Recorder error')
    btnDisabled.value = false
  }
}

function stopRecord() {
  try { mr?.stop() } catch {}
}

function pickVideoMime(): string | null {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  for (const c of candidates) if ((window as any).MediaRecorder?.isTypeSupported?.(c)) return c
  return null
}
</script>

<template>
  <div style="display:grid; gap:.5rem">
    <div style="display:flex; justify-content:space-between; align-items:center">
      <strong>Program Mix</strong>
      <div style="display:flex; gap:.5rem; align-items:center">
        <label style="display:flex; gap:.25rem; align-items:center; color:#e5e7eb">
          <input type="checkbox" v-model="monitor" @change="()=>{ if(programEl) programEl.muted = !monitor }" /> Monitor
        </label>
        <label style="display:flex; gap:.25rem; align-items:center; color:#e5e7eb">
          <span>Layout</span>
          <select v-model="layout">
            <option value="pip">Screen + Camera (PIP)</option>
            <option value="camera">Camera Only</option>
            <option value="grid2">Two-Up Grid</option>
          </select>
        </label>
      </div>
    </div>
    <video ref="programEl" playsinline muted style="width:100%; aspect-ratio:16/9; background:#000; border-radius:8px"></video>
    <div style="display:flex; gap:.5rem; align-items:center">
      <button :disabled="btnDisabled || recording" @click="startRecord">Record Program</button>
      <button :disabled="!recording" @click="stopRecord">Stop</button>
      <a v-if="!progressive && dlHref" :href="dlHref" download="program-mix.webm">Download</a>
      <span style="color:#666">{{ status }}</span>
    </div>
    <p v-if="progressive && !props.workerBase" style="color:#b45309;margin:0">Progressive upload is enabled but no Worker URL configured. Recording will stay local.</p>
  </div>
</template>

