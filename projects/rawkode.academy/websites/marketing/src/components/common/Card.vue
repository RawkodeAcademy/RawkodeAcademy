<script setup lang="ts">
interface Props {
	title?: string;
	variant?: 'default' | 'featured';
}

const { title, variant = 'default' } = defineProps<Props>();

const baseClasses = 'rounded-lg border p-6';
const variantClasses = {
	default: 'border-neutral-800 bg-neutral-900',
	featured: 'border-blue-600 bg-gradient-to-br from-blue-950 to-neutral-950',
};

const classes = `${baseClasses} ${variantClasses[variant]}`;
</script>

<template>
	<div :class="classes">
		<h3 v-if="title" class="mb-4 text-xl font-semibold">{{ title }}</h3>
		<slot />
	</div>
</template>
