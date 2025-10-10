<script setup lang="ts">
import { computed } from 'vue'
import { Select, createListCollection } from '@ark-ui/vue/select'

type QualityValue = 'auto' | 'f' | 'h' | 'q'

const props = defineProps<{ modelValue?: QualityValue; disabled?: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: QualityValue): void }>()

const items = [
  { id: 'auto', label: 'Auto' },
  { id: 'f', label: '1080p' },
  { id: 'h', label: '720p' },
  { id: 'q', label: '360p' },
] as const

const collection = createListCollection({ items: items.map((i) => i.id) })

const selected = ref<string[]>([props.modelValue ?? 'auto'])
watch(selected, (arr) => {
  const rid = (arr?.[0] as QualityValue) ?? 'auto'
  try { (window as any).rksViewer?.setPreferredRid?.(rid) } catch {}
  emit('update:modelValue', rid)
})
</script>

<template>
  <Select.Root
    :collection="collection"
    v-model:modelValue="selected"
    :disabled="props.disabled"
    closeOnSelect
  >
    <Select.Label>Quality</Select.Label>
    <Select.Control>
      <Select.Trigger>
        <Select.ValueText placeholder="Select quality" />
        <Select.Indicator>▼</Select.Indicator>
      </Select.Trigger>
      <Select.ClearTrigger>Clear</Select.ClearTrigger>
    </Select.Control>
    <Teleport to="body">
      <Select.Positioner>
        <Select.Content>
          <Select.ItemGroup>
            <Select.ItemGroupLabel>Options</Select.ItemGroupLabel>
            <Select.Item v-for="i in items" :key="i.id" :item="i.id">
              <Select.ItemText>{{ i.label }}</Select.ItemText>
              <Select.ItemIndicator>✓</Select.ItemIndicator>
            </Select.Item>
          </Select.ItemGroup>
        </Select.Content>
      </Select.Positioner>
    </Teleport>
    <Select.HiddenSelect />
  </Select.Root>
</template>
