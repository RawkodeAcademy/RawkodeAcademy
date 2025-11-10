<script setup lang="ts">
interface Props {
	title: string;
	subtitle?: string;
	eyebrow?: string;
}

const { title, subtitle, eyebrow } = defineProps<Props>();
</script>

<template>
	<section class="bg-gradient-to-b from-neutral-900 to-neutral-950 py-20">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mx-auto max-w-3xl text-center">
				<p v-if="eyebrow" class="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-400">
					{{ eyebrow }}
				</p>
				<h1 class="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
					{{ title }}
				</h1>
				<p v-if="subtitle" class="text-lg text-neutral-300 sm:text-xl">
					{{ subtitle }}
				</p>
				<div class="mt-8">
					<slot />
				</div>
			</div>
		</div>
	</section>
</template>
