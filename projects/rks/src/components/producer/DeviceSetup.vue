<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { Switch } from '@ark-ui/vue/switch'
import { RadioGroup } from '@ark-ui/vue/radio-group'
import '../../styles/studio.css'
import { Select, createListCollection } from '@ark-ui/vue/select'
import { ChevronDownIcon } from 'lucide-vue-next'

type Device = MediaDeviceInfo

const emit = defineEmits<{
  (e: 'preview-stream', stream: MediaStream | null): void
  (e: 'screen-stream', stream: MediaStream | null): void
  (e: 'config', cfg: any): void
}>()

const props = defineProps<{
  showPreview?: boolean
  allowScreenShare?: boolean
}>()

const audioInputs = ref<Device[]>([])
const videoInputs = ref<Device[]>([])

const selectedMic = ref<string>('')
const selectedCam = ref<string>('')
const res = ref<string>('1920x1080')
const fps = ref<string>('30')
const aec = ref<boolean>(true)
const ns = ref<boolean>(true)
const agc = ref<boolean>(true)

const previewEl = ref<HTMLVideoElement | null>(null)
const screenEl = ref<HTMLVideoElement | null>(null)
let previewStream: MediaStream | null = null
let screenStream: MediaStream | null = null
const previewActive = ref<boolean>(false)
const errorMsg = ref<string>('')
let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
const level = ref<number>(0)
const peak = ref<number>(0)

const resolutions = [
  '3840x2160',
  '2560x1440',
  '1920x1080',
  '1280x720',
  '640x360',
]
const fpsOptions = ['24', '30', '60']

// Ark UI Select collections and controlled values (single-select via 1-length arrays)
let micCollection = createListCollection({ items: [] as { label: string; value: string }[] })
let camCollection = createListCollection({ items: [] as { label: string; value: string }[] })
let resCollection = createListCollection({ items: [] as { label: string; value: string }[] })
const micValue = ref<string[]>([])
const camValue = ref<string[]>([])
const resValue = ref<string[]>([])

onMounted(async () => {
  loadPrefs()
  await refreshDevices()
  if (props.showPreview !== false) {
    try {
      await startPreview()
    } catch (e: any) {
      errorMsg.value = friendlyError(e)
    }
  }
  emit('config', currentConfig())
})

onUnmounted(() => {
  stopPreview()
  stopScreen()
  audioCtx?.close().catch(() => {})
})

watch([selectedMic, selectedCam, res, fps, aec, ns, agc], async () => {
  savePrefs()
  emit('config', currentConfig())
  if (props.showPreview !== false && previewActive.value) {
    try { await startPreview() } catch (e:any) { errorMsg.value = friendlyError(e) }
  }
})

function currentConfig() {
  const [w, h] = res.value.split('x').map((x) => parseInt(x, 10))
  return {
    audioDeviceId: selectedMic.value || undefined,
    videoDeviceId: selectedCam.value || undefined,
    width: w, height: h, frameRate: parseInt(fps.value, 10),
    echoCancellation: aec.value,
    noiseSuppression: ns.value,
    autoGainControl: agc.value,
  }
}

async function refreshDevices() {
  try {
    // Hint permissions to expose labels
    await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  } catch {}
  const devs = await navigator.mediaDevices.enumerateDevices()
  audioInputs.value = devs.filter((d) => d.kind === 'audioinput')
  videoInputs.value = devs.filter((d) => d.kind === 'videoinput')
  // Default to first devices if none selected
  if (!selectedMic.value && audioInputs.value[0]) selectedMic.value = audioInputs.value[0].deviceId
  if (!selectedCam.value && videoInputs.value[0]) selectedCam.value = videoInputs.value[0].deviceId
  syncCollections()
}

function syncCollections() {
  micCollection = createListCollection({ items: audioInputs.value.map((d) => ({ label: d.label || d.deviceId, value: d.deviceId })) })
  camCollection = createListCollection({ items: videoInputs.value.map((d) => ({ label: d.label || d.deviceId, value: d.deviceId })) })
  resCollection = createListCollection({ items: resolutions.map((r) => ({ label: r, value: r })) })
  micValue.value = selectedMic.value ? [selectedMic.value] : []
  camValue.value = selectedCam.value ? [selectedCam.value] : []
  resValue.value = res.value ? [res.value] : []
}

async function startPreview() {
  stopPreview()
  const [w, h] = res.value.split('x').map((x) => parseInt(x, 10))
  const fpsNum = parseInt(fps.value, 10) || 30
  const primary: MediaStreamConstraints = {
    audio: selectedMic.value
      ? { deviceId: { exact: selectedMic.value }, echoCancellation: aec.value, noiseSuppression: ns.value, autoGainControl: agc.value }
      : { echoCancellation: aec.value, noiseSuppression: ns.value, autoGainControl: agc.value },
    video: selectedCam.value
      ? { deviceId: { exact: selectedCam.value }, width: { ideal: w }, height: { ideal: h }, frameRate: { ideal: fpsNum } }
      : { width: { ideal: w }, height: { ideal: h }, frameRate: { ideal: fpsNum } },
  }
  const fallback: MediaStreamConstraints = { audio: true, video: true }

  let stream: MediaStream | null = null
  try {
    stream = await navigator.mediaDevices.getUserMedia(primary)
  } catch (e: any) {
    console.warn('gUM primary failed, retrying with fallback', e)
    try {
      stream = await navigator.mediaDevices.getUserMedia(fallback)
    } catch (e2: any) {
      errorMsg.value = friendlyError(e2)
      previewActive.value = false
      emit('preview-stream', null)
      return
    }
  }

  previewStream = stream
  if (previewEl.value) {
    previewEl.value.srcObject = stream
    previewEl.value.muted = true
    try { await previewEl.value.play() } catch {}
  }
  setupAudioMeter(stream)
  emit('preview-stream', stream)
  previewActive.value = true
  errorMsg.value = ''
}

function stopPreview() {
  if (previewStream) {
    previewStream.getTracks().forEach((t) => t.stop())
    previewStream = null
  }
  if (previewEl.value) previewEl.value.srcObject = null
  emit('preview-stream', null)
  previewActive.value = false
}

async function startScreen() {
  stopScreen()
  // audio is off by default to avoid system-audio capture unless needed
  const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false })
  screenStream = stream
  if (screenEl.value) {
    screenEl.value.srcObject = stream
    await screenEl.value.play().catch(() => {})
  }
  emit('screen-stream', stream)
  const [track] = stream.getVideoTracks()
  if (track) {
    track.addEventListener('ended', () => stopScreen())
  }
}

function stopScreen() {
  if (screenStream) {
    screenStream.getTracks().forEach((t) => t.stop())
    screenStream = null
  }
  if (screenEl.value) screenEl.value.srcObject = null
  emit('screen-stream', null)
}

function setupAudioMeter(stream: MediaStream) {
  try {
    audioCtx?.close().catch(() => {})
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    const src = audioCtx.createMediaStreamSource(stream)
    src.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      if (!analyser) return
      analyser.getByteTimeDomainData(data)
      // Compute simple RMS
      let sum = 0
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.sqrt(sum / data.length)
      level.value = Math.min(1, rms * 2)
      peak.value = Math.max(level.value, peak.value * 0.9)
      requestAnimationFrame(tick)
    }
    tick()
  } catch {}
}

function friendlyError(e: any): string {
  const name = e?.name || ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Permission denied. Please allow camera and microphone.'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'Selected device unavailable. Choose a different mic/camera.'
  if (name === 'NotReadableError') return 'Device is in use by another app. Close it and retry.'
  return String(e?.message || e) || 'Failed to start preview.'
}

function savePrefs() {
  localStorage.setItem('rks.camId', selectedCam.value)
  localStorage.setItem('rks.micId', selectedMic.value)
  localStorage.setItem('rks.res', res.value)
  localStorage.setItem('rks.fps', String(fps.value))
  localStorage.setItem('rks.aec', String(aec.value))
  localStorage.setItem('rks.ns', String(ns.value))
  localStorage.setItem('rks.agc', String(agc.value))
}

function loadPrefs() {
  selectedCam.value = localStorage.getItem('rks.camId') || ''
  selectedMic.value = localStorage.getItem('rks.micId') || ''
  res.value = localStorage.getItem('rks.res') || '1920x1080'
  fps.value = localStorage.getItem('rks.fps') || '30'
  aec.value = (localStorage.getItem('rks.aec') ?? 'true') === 'true'
  ns.value = (localStorage.getItem('rks.ns') ?? 'true') === 'true'
  agc.value = (localStorage.getItem('rks.agc') ?? 'true') === 'true'
  syncCollections()
}

// Map Ark UI v-model arrays to simple string state
watch(micValue, (v) => { selectedMic.value = v[0] ?? '' })
watch(camValue, (v) => { selectedCam.value = v[0] ?? '' })
watch(resValue, (v) => { res.value = v[0] ?? res.value })
</script>

<template>
  <div style="display:grid; gap:.75rem">
    <div style="display:flex; gap:.75rem; align-items:center; flex-wrap: wrap">
      <Select.Root :collection="micCollection" v-model="micValue" style="min-width: 260px">
        <Select.Label>Mic</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Select microphone" />
            <Select.Indicator>
              <ChevronDownIcon />
            </Select.Indicator>
          </Select.Trigger>
          <Select.ClearTrigger>Clear</Select.ClearTrigger>
        </Select.Control>
        <Teleport to="body">
          <Select.Positioner>
            <Select.Content>
              <Select.Item v-for="item in micCollection.items" :key="item.value" :item="item">
                <Select.ItemText>{{ item.label }}</Select.ItemText>
                <Select.ItemIndicator>✓</Select.ItemIndicator>
              </Select.Item>
            </Select.Content>
          </Select.Positioner>
        </Teleport>
        <Select.HiddenSelect />
      </Select.Root>

      <Select.Root :collection="camCollection" v-model="camValue" style="min-width: 260px">
        <Select.Label>Camera</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Select camera" />
            <Select.Indicator>
              <ChevronDownIcon />
            </Select.Indicator>
          </Select.Trigger>
          <Select.ClearTrigger>Clear</Select.ClearTrigger>
        </Select.Control>
        <Teleport to="body">
          <Select.Positioner>
            <Select.Content>
              <Select.Item v-for="item in camCollection.items" :key="item.value" :item="item">
                <Select.ItemText>{{ item.label }}</Select.ItemText>
                <Select.ItemIndicator>✓</Select.ItemIndicator>
              </Select.Item>
            </Select.Content>
          </Select.Positioner>
        </Teleport>
        <Select.HiddenSelect />
      </Select.Root>

      <Select.Root :collection="resCollection" v-model="resValue" style="min-width: 180px">
        <Select.Label>Resolution</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Resolution" />
            <Select.Indicator>
              <ChevronDownIcon />
            </Select.Indicator>
          </Select.Trigger>
          <Select.ClearTrigger>Clear</Select.ClearTrigger>
        </Select.Control>
        <Teleport to="body">
          <Select.Positioner>
            <Select.Content>
              <Select.Item v-for="item in resCollection.items" :key="item.value" :item="item">
                <Select.ItemText>{{ item.label }}</Select.ItemText>
                <Select.ItemIndicator>✓</Select.ItemIndicator>
              </Select.Item>
            </Select.Content>
          </Select.Positioner>
        </Teleport>
        <Select.HiddenSelect />
      </Select.Root>
      <div>
        <RadioGroup.Root v-model="fps" orientation="horizontal">
          <RadioGroup.Label>FPS</RadioGroup.Label>
          <div style="display:flex; gap:.25rem; align-items:center">
            <RadioGroup.Item v-for="f in fpsOptions" :key="f" :value="f">
              <RadioGroup.ItemText>{{ f }}</RadioGroup.ItemText>
              <RadioGroup.ItemControl />
            </RadioGroup.Item>
          </div>
        </RadioGroup.Root>
      </div>
      <Switch.Root v-model:checked="aec">
        <Switch.Label>AEC</Switch.Label>
        <Switch.Control><Switch.Thumb /></Switch.Control>
      </Switch.Root>
      <Switch.Root v-model:checked="ns">
        <Switch.Label>NS</Switch.Label>
        <Switch.Control><Switch.Thumb /></Switch.Control>
      </Switch.Root>
      <Switch.Root v-model:checked="agc">
        <Switch.Label>AGC</Switch.Label>
        <Switch.Control><Switch.Thumb /></Switch.Control>
      </Switch.Root>
      <button @click="refreshDevices">Refresh Devices</button>
    </div>

    <div v-if="props.showPreview !== false" style="display:grid; grid-template-columns: 1fr 1fr; gap:.75rem">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center">
          <strong>Camera Preview</strong>
          <div style="display:flex; gap:.5rem">
            <button @click="startPreview">Start</button>
            <button @click="stopPreview">Stop</button>
          </div>
        </div>
        <div style="position:relative">
          <video ref="previewEl" playsinline muted style="width:100%; aspect-ratio:16/9; background:#000; border-radius:8px"></video>
          <div style="position:absolute; left:.5rem; bottom:.5rem; display:flex; gap:2px; padding:2px 4px; background:rgba(0,0,0,.35); border-radius:4px">
            <span v-for="i in 5" :key="i" :style="{
              display:'inline-block', width:'4px', borderRadius:'2px',
              height: (Math.max(0.2, i/5) * 12) + 'px',
              background: (i <= Math.ceil(peak*5)) ? '#22c55e' : '#4b5563',
              opacity: (i <= Math.ceil(level*5)) ? 1 : 0.6,
            }" />
          </div>
        </div>
        <p v-if="errorMsg" style="color:#b91c1c; margin:.25rem 0 0">{{ errorMsg }}</p>
        <div style="height:8px; background:#eee; border-radius:4px; margin-top:.25rem">
          <div :style="{ width: Math.round(level*100)+'%', height:'8px', background:'#22c55e', borderRadius:'4px' }"></div>
        </div>
      </div>
      <div v-if="props.allowScreenShare !== false">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <strong>Screenshare</strong>
          <div style="display:flex; gap:.5rem">
            <button @click="startScreen">Share Screen</button>
            <button @click="stopScreen">Stop</button>
          </div>
        </div>
        <video ref="screenEl" playsinline style="width:100%; aspect-ratio:16/9; background:#000; border-radius:8px"></video>
      </div>
    </div>
  </div>
</template>
