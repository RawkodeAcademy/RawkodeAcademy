<script setup lang="ts">
interface Props {
	variant?: 'primary' | 'secondary' | 'outline';
	size?: 'sm' | 'md' | 'lg';
	href?: string;
}

const { variant = 'primary', size = 'md', href } = defineProps<Props>();

const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-950';

const variantClasses = {
	primary: 'bg-blue-600 text-white hover:bg-blue-700',
	secondary: 'bg-neutral-800 text-white hover:bg-neutral-700',
	outline: 'border border-neutral-700 text-neutral-50 hover:bg-neutral-800',
};

const sizeClasses = {
	sm: 'px-3 py-1.5 text-sm',
	md: 'px-4 py-2 text-base',
	lg: 'px-6 py-3 text-lg',
};

const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
</script>

<template>
	<a v-if="href" :href="href" :class="classes">
		<slot />
	</a>
	<button v-else :class="classes">
		<slot />
	</button>
</template>
