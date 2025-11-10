<template>
  <div :class="['terminal shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-xl overflow-hidden border border-gray-700/40', className]">
    <div class="terminal-header bg-gray-800/80 backdrop-blur-md px-4 py-2 flex items-center justify-between border-b border-gray-700/40">
      <div class="flex space-x-2">
        <div class="w-3 h-3 bg-red-500 rounded-full"></div>
        <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
        <div class="w-3 h-3 bg-green-500 rounded-full"></div>
      </div>
      <div class="text-gray-400 text-sm font-mono">{{ title }}</div>
      <div class="w-14"></div>
    </div>
    <div class="terminal-body bg-gray-900/90 backdrop-blur-sm text-gray-100 p-4 font-mono text-sm">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
	title?: string;
	class?: string;
}

const props = withDefaults(defineProps<Props>(), {
	title: "Terminal",
	class: "",
});

const className = props.class;
</script>

<style scoped>
.terminal {
  background: #1a1a1a;
}

.terminal-body {
  min-height: 100px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>