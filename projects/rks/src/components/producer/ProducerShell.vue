<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Tabs } from '@ark-ui/vue/tabs'
import DeviceSetup from './DeviceSetup.vue'
import ProgramPreview from './ProgramPreview.vue'
import { createPublisher, type Publisher } from '../../lib/media/publisher'

type RaiseHand = { id: string; userId: string; status: 'OPEN' | 'ACCEPTED' | 'REJECTED'; createdAt: string }

const props = defineProps<{ showId?: string; sessionId?: string; workerBase?: string | null }>()
const loading = ref(false)
const raiseHands = ref<RaiseHand[]>([])
const cfg = ref<any | null>(null)
const previewStream = ref<MediaStream | null>(null)
const screenStream = ref<MediaStream | null>(null)
const pubStatus = ref<'idle' | 'starting' | 'live' | 'stopped' | 'error'>('idle')
let publisher: Publisher | null = null
// Fallback preview
const fbVideoEl = ref<HTMLVideoElement | null>(null)
let fbStream: MediaStream | null = null

onMounted(() => {
  void fetchSnapshot()
})

function chipLabel(state: 'idle' | 'starting' | 'live' | 'stopped' | 'error') {
  switch (state) {
    case 'starting': return 'Opening'
    case 'live': return 'Open'
    case 'stopped': return 'Closed'
    case 'error': return 'Error'
    default: return 'Idle'
  }
}
function chipStyle(state: 'idle' | 'starting' | 'live' | 'stopped' | 'error') {
  const base = 'padding:2px 8px;border-radius:9999px;font-size:.8rem;border:1px solid '
  switch (state) {
    case 'starting': return base + '#a16207;background:#fde68a;color:#1f2937'
    case 'live': return base + '#16a34a;background:#bbf7d0;color:#064e3b'
    case 'error': return base + '#b91c1c;background:#fecaca;color:#7f1d1d'
    case 'stopped': return base + '#4b5563;background:#e5e7eb;color:#111827'
    default: return base + '#4b5563;background:#e5e7eb;color:#111827'
  }
}

async function fetchSnapshot() {
  if (!props.workerBase) return
  loading.value = true
  try {
    const path = props.sessionId
      ? `/sessions/${props.sessionId}/state/snapshot`
      : `/shows/${props.showId}/state/snapshot`
    try {
      const res = await fetch(`${props.workerBase}${path}`)
      if (res.ok) {
        const json = (await res.json()) as { raiseHands?: RaiseHand[] }
        raiseHands.value = json.raiseHands ?? []
      }
    } catch (e) {
      console.warn('snapshot fetch failed (non-blocking)', e)
    }
  } finally {
    loading.value = false
  }
}

function accept(id: string) {
  // TODO: wire to Worker action
  alert(`Accept ${id} (stub)`) // eslint-disable-line no-alert
}

function onPreviewStream(s: MediaStream | null) {
  previewStream.value = s
}
function onScreenStream(s: MediaStream | null) {
  screenStream.value = s
}
function onConfig(c: any) {
  cfg.value = c
}

async function startPublish() {
  try {
    pubStatus.value = 'starting'
    const base = props.workerBase || null
    const c = cfg.value || {}
    const pub = await createPublisher({
      camera: true,
      microphone: true,
      workerBase: base,
      appSessionId: props.sessionId || undefined,
      audioDeviceId: c?.audioDeviceId,
      videoDeviceId: c?.videoDeviceId,
      echoCancellation: c?.echoCancellation,
      noiseSuppression: c?.noiseSuppression,
      autoGainControl: c?.autoGainControl,
      width: c?.width,
      height: c?.height,
      frameRate: c?.frameRate,
    })
    publisher = pub
    if (screenStream.value) await pub.addScreenShare(screenStream.value)
    await pub.negotiate()
    pubStatus.value = 'live'
  } catch (e) {
    console.error(e)
    pubStatus.value = 'error'
  }
}

async function stopPublish() {
  try { await publisher?.stop() } catch {}
  publisher = null
  pubStatus.value = 'stopped'
}

async function startFallbackPreview() {
  try {
    fbStream?.getTracks().forEach(t => t.stop())
    fbStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    if (fbVideoEl.value) {
      fbVideoEl.value.srcObject = fbStream
      fbVideoEl.value.muted = true
      try { await fbVideoEl.value.play() } catch {}
    }
  } catch (e) {
    console.warn('fallback preview failed', e)
  }
}
function stopFallbackPreview() {
  try { fbStream?.getTracks().forEach(t => t.stop()) } catch {}
  fbStream = null
  if (fbVideoEl.value) fbVideoEl.value.srcObject = null
}
</script>

<template>
  <div style="display: grid; gap: 1rem">
    <Tabs.Root defaultValue="preview">
      <Tabs.List>
        <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
        <Tabs.Trigger value="scenes">Scenes</Tabs.Trigger>
        <Tabs.Trigger value="grid">Grid</Tabs.Trigger>
        <Tabs.Trigger value="overlays">Overlays</Tabs.Trigger>
        <Tabs.Trigger value="guests">Guests</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="preview">
        <div style="display:grid; gap:.75rem; background:#0b0b0d; border:1px solid #1f2937; border-radius:12px; padding:12px">
          <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:.25rem; border-bottom:1px solid #111">
            <strong style="letter-spacing:.2px">Studio Preview</strong>
            <div style="display:flex; gap:.5rem; align-items:center">
              <span style="color:#9ca3af; font-size:.9rem">Worker: {{ props.workerBase ? 'connected' : 'local' }}</span>
              <span :style="chipStyle(pubStatus)">{{ chipLabel(pubStatus) }}</span>
            </div>
          </div>
          <DeviceSetup
            @config="onConfig"
            @preview-stream="onPreviewStream"
            @screen-stream="onScreenStream"
          />
          <ProgramPreview
            :show-id="props.showId"
            :worker-base="props.workerBase"
            :camera-stream="previewStream"
            :screen-stream="screenStream"
          />
          <div v-if="!previewStream" style="display:grid; gap:.5rem; border:1px dashed #374151; border-radius:8px; padding:8px">
            <div style="display:flex; justify-content:space-between; align-items:center">
              <strong>Fallback Preview</strong>
              <div style="display:flex; gap:.5rem">
                <button @click="startFallbackPreview">Start</button>
                <button @click="stopFallbackPreview">Stop</button>
              </div>
            </div>
            <video ref="fbVideoEl" playsinline muted style="width:100%; aspect-ratio:16/9; background:#000; border-radius:8px"></video>
            <p style="color:#9ca3af; font-size:.9rem">If your device preview doesn’t appear above, use this quick preview to verify camera/mic access.</p>
          </div>
          <div style="display:flex; gap:.5rem; align-items:center; padding-top:.25rem; border-top:1px solid #111">
            <button :disabled="pubStatus==='starting' || pubStatus==='live'" @click="startPublish">{{ pubStatus==='starting' ? 'Opening…' : 'Open Session' }}</button>
            <button :disabled="pubStatus!=='live'" @click="stopPublish">Close Session</button>
            <span style="color:#666">Status: {{ chipLabel(pubStatus) }}</span>
          </div>
        </div>
      </Tabs.Content>

      <Tabs.Content value="scenes">
        <p>Scenes editor coming soon.</p>
      </Tabs.Content>

      <Tabs.Content value="grid">
        <p>Dynamic grid composer coming soon.</p>
      </Tabs.Content>

      <Tabs.Content value="overlays">
        <p>Overlays and lower-thirds coming soon.</p>
      </Tabs.Content>

      <Tabs.Content value="guests">
        <div style="display: grid; gap: .5rem">
          <div style="display: flex; justify-content: space-between; align-items: center">
            <strong>Raise-hand Queue</strong>
            <button :disabled="loading" @click="fetchSnapshot">{{ loading ? 'Refreshing…' : 'Refresh' }}</button>
          </div>
          <p v-if="raiseHands.length === 0">No requests.</p>
          <ul v-else>
            <li
              v-for="r in raiseHands"
              :key="r.id"
              style="display: flex; gap: .5rem; align-items: center"
            >
              <span>{{ r.userId }}</span>
              <span style="color:#666">— {{ r.status }}</span>
              <button @click="accept(r.id)">Accept</button>
            </li>
          </ul>
        </div>
      </Tabs.Content>
    </Tabs.Root>
  </div>
  
</template>
