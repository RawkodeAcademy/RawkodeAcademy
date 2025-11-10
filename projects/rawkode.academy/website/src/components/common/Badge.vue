<template>
  <span :class="computedClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed, useAttrs } from "vue";

interface Props {
	variant?:
		| "default"
		| "primary"
		| "secondary"
		| "tertiary"
		| "success"
		| "warning"
		| "danger"
		| "info";
	size?: "xs" | "sm" | "md" | "lg";
	rounded?: "none" | "sm" | "md" | "lg" | "full";
	outline?: boolean;
	class?: string;
}

const props = withDefaults(defineProps<Props>(), {
	variant: "default",
	size: "md",
	rounded: "full",
	outline: false,
});

const baseClasses = "inline-flex items-center font-semibold transition-all duration-200 backdrop-blur-md shadow-sm";

const variantClasses = {
	default: props.outline
		? "border border-gray-300/50 text-gray-700 dark:border-gray-600/50 dark:text-gray-300 bg-white/30 dark:bg-gray-800/30"
		: "bg-gray-500/20 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300 border border-gray-400/30 dark:border-gray-600/30",
	primary: props.outline
		? "border border-primary/50 text-primary bg-white/30 dark:bg-gray-900/30"
		: "bg-primary/20 text-primary dark:bg-primary/30 border border-primary/30",
	secondary: props.outline
		? "border border-secondary/50 text-secondary bg-white/30 dark:bg-gray-900/30"
		: "bg-secondary/20 text-secondary dark:bg-secondary/30 border border-secondary/30",
	tertiary: props.outline
		? "border border-tertiary/50 text-tertiary bg-white/30 dark:bg-gray-900/30"
		: "bg-tertiary/20 text-tertiary dark:bg-tertiary/30 border border-tertiary/30",
	success: props.outline
		? "border border-green-600/50 text-green-600 dark:border-green-400/50 dark:text-green-400 bg-white/30 dark:bg-gray-900/30"
		: "bg-green-500/20 text-green-700 dark:bg-green-700/30 dark:text-green-300 border border-green-500/30 dark:border-green-600/30",
	warning: props.outline
		? "border border-yellow-600/50 text-yellow-600 dark:border-yellow-400/50 dark:text-yellow-400 bg-white/30 dark:bg-gray-900/30"
		: "bg-yellow-500/20 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300 border border-yellow-500/30 dark:border-yellow-600/30",
	danger: props.outline
		? "border border-red-600/50 text-red-600 dark:border-red-400/50 dark:text-red-400 bg-white/30 dark:bg-gray-900/30"
		: "bg-red-500/20 text-red-700 dark:bg-red-700/30 dark:text-red-300 border border-red-500/30 dark:border-red-600/30",
	info: props.outline
		? "border border-blue-600/50 text-blue-600 dark:border-blue-400/50 dark:text-blue-400 bg-white/30 dark:bg-gray-900/30"
		: "bg-blue-500/20 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300 border border-blue-500/30 dark:border-blue-600/30",
};

const sizeClasses = {
	xs: "px-2 py-0.5 text-xs",
	sm: "px-2.5 py-0.5 text-sm",
	md: "px-3 py-1 text-sm",
	lg: "px-4 py-1.5 text-base",
};

const roundedClasses = {
	none: "rounded-none",
	sm: "rounded-sm",
	md: "rounded-md",
	lg: "rounded-lg",
	full: "rounded-full",
};

const attrs = useAttrs();

const badgeClasses = computed(() => {
	return [
		baseClasses,
		variantClasses[props.variant],
		sizeClasses[props.size],
		roundedClasses[props.rounded],
	].join(" ");
});

const computedClasses = computed(() => {
	return [badgeClasses.value, props.class || attrs.class]
		.filter(Boolean)
		.join(" ");
});
</script>