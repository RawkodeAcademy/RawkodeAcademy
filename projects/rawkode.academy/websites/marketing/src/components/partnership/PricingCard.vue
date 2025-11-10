<script setup lang="ts">
import Button from '../common/Button.vue';

interface Props {
	tier: string;
	price: string;
	priceAnnual?: string;
	description: string;
	features: string[];
	featured?: boolean;
}

const { tier, price, priceAnnual, description, features, featured = false } = defineProps<Props>();
</script>

<template>
	<div
		:class="[
			'rounded-lg border p-8',
			featured
				? 'border-blue-600 bg-gradient-to-br from-blue-950 to-neutral-950 shadow-2xl shadow-blue-900/50'
				: 'border-neutral-800 bg-neutral-900',
		]"
	>
		<div v-if="featured" class="mb-4 inline-block rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold">
			Most Popular
		</div>
		<h3 class="mb-2 text-2xl font-bold">{{ tier }}</h3>
		<div class="mb-4">
			<span class="text-4xl font-bold">{{ price }}</span>
			<span class="text-neutral-400">/year</span>
		</div>
		<p class="mb-6 text-neutral-400">{{ description }}</p>
		<ul class="mb-8 space-y-3">
			<li v-for="feature in features" :key="feature" class="flex items-start">
				<svg class="mr-2 mt-1 h-5 w-5 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<span>{{ feature }}</span>
			</li>
		</ul>
		<Button :variant="featured ? 'primary' : 'outline'" size="lg" href="/contact" class="w-full">
			Get Started
		</Button>
	</div>
</template>
