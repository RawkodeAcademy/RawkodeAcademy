<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DeviceSetup from '../producer/DeviceSetup.vue'
import { createPublisher, type Publisher } from '../../lib/media/publisher'
import '../../styles/studio.css'
import { createViewerClient, type ViewerClient } from '../../lib/player/client'
import { createTestPatternStream } from '../../lib/player/testpattern'

const props = defineProps<{ sessionId: string; workerBase?: string | null }>()

const cfg = ref<any | null>(null)
const screenStream = ref<MediaStream | null>(null)
const status = ref<'idle' | 'ready' | 'joining' | 'joined' | 'error'>('idle')
let publisher: Publisher | null = null
let viewer: ViewerClient | null = null
const programEl = ref<HTMLVideoElement | null>(null)
const monitor = ref<boolean>(false)
let tpStop: (() => void) | null = null

function updateCfg(c: any) {
  cfg.value = c
  status.value = 'ready'
}

async function join() {
  try {
    status.value = 'joining'
    const pub = await createPublisher({
      camera: true,
      microphone: true,
      workerBase: props.workerBase || null,
      ...cfg.value,
    })
    publisher = pub
    if (screenStream.value) await pub.addScreenShare(screenStream.value)
    await pub.negotiate()
    status.value = 'joined'
  } catch (e) {
    console.error(e)
    status.value = 'error'
  }
}

async function leave() {
  try { await publisher?.stop() } catch {}
  publisher = null
  status.value = 'idle'
}

onMounted(async () => {
  // Start program/mix viewer
  try {
    if (programEl.value) {
      const client = createViewerClient({ workerBase: props.workerBase || null, videoEl: programEl.value })
      viewer = client
      let trackId: string | null = null
      // attempt to fetch a program track id for this session (best effort)
      if (props.workerBase) {
        try {
          const r = await fetch(`${props.workerBase}/rtk/program/${props.sessionId}`)
          if (r.ok) { const j = await r.json(); trackId = j.trackId || null }
        } catch {}
      }
      if (props.workerBase) await client.start(trackId)
      // Fallback if no stream within 1.5s (dev/stub mode)
      setTimeout(() => {
        const hasStream = !!(programEl.value && (programEl.value as any).srcObject)
        if (!hasStream && programEl.value) {
          const { stream, stop } = createTestPatternStream({ width: 1280, height: 720, fps: 30, tone: false })
          tpStop = stop
          ;(programEl.value as any).srcObject = stream
          try { programEl.value.play() } catch {}
        }
      }, 1500)
    }
  } catch (e) {
    console.warn('green room viewer failed', e)
  }
})
</script>

<template>
  <div style="display:grid; gap:1rem">
    <div style="display:flex; justify-content:space-between; align-items:center; background:#0b0b0d; border:1px solid #1f2937; border-radius:12px; padding:8px 12px">
      <strong style="letter-spacing:.2px">Green Room</strong>
      <span :style="statusStyle">{{ statusLabel }}</span>
    </div>
    <div style="display:grid; grid-template-columns: 1fr; gap:.75rem">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center">
          <strong>Program Mix</strong>
          <label style="display:flex; gap:.25rem; align-items:center; color:#e5e7eb">
            <input type="checkbox" v-model="monitor" @change="()=>{ if(programEl) programEl.muted = !monitor }" /> Monitor Audio
          </label>
        </div>
        <video ref="programEl" playsinline muted style="width:100%; aspect-ratio:16/9; background:#000; border-radius:8px"></video>
      </div>
      <DeviceSetup @config="updateCfg" :showPreview="false" :allowScreenShare="false" />
    </div>
    <div style="display:flex; gap:.5rem; align-items:center; padding-top:.25rem">
      <button :disabled="status!=='ready' && status!=='error'" @click="join">
        {{ status==='joining' ? 'Joining…' : 'Join Green Room' }}
      </button>
      <button :disabled="status!=='joined'" @click="leave">Leave</button>
      <span style="color:#666">Status: {{ status }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
// Computed helpers for header chip
const statusLabel = computed(() => {
  switch (status.value) {
    case 'joining': return 'Connecting'
    case 'joined': return 'On Air'
    case 'error': return 'Error'
    case 'ready': return 'Ready'
    default: return 'Idle'
  }
})
const statusStyle = computed(() => {
  const base = 'padding:2px 8px;border-radius:9999px;font-size:.8rem;border:1px solid '
  switch (status.value) {
    case 'joining': return base + '#a16207;background:#fde68a;color:#1f2937'
    case 'joined': return base + '#16a34a;background:#bbf7d0;color:#064e3b'
    case 'error': return base + '#b91c1c;background:#fecaca;color:#7f1d1d'
    case 'ready': return base + '#4b5563;background:#e5e7eb;color:#111827'
    default: return base + '#4b5563;background:#e5e7eb;color:#111827'
  }
})
</script>
