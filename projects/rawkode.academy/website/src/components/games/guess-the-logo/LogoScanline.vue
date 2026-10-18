<script setup lang="ts">
import { academyGame } from "@rawkodeacademy/design-system";
const gameTheme = academyGame();
defineProps<{
	iconUrl: string;
	revealed: boolean;
}>();
</script>

<template>
	<div class="gtl-logo-card" :class="[gameTheme.root, { revealed }]">
		<!--
			Homepage Hero technique: the duotone logo is cut into scanlines by a
			repeating-gradient mask on its container, so the lines are the logo
			itself rather than a stripe overlay painted across the card.
		-->
		<div class="gtl-logo-duotone" aria-hidden="true">
			<div class="gtl-logo-mask-cyan" :style="`--icon-url: url(${iconUrl})`"></div>
			<div class="gtl-logo-mask-purple" :style="`--icon-url: url(${iconUrl})`"></div>
		</div>
		<img
			:src="iconUrl"
			alt=""
			class="gtl-logo-img"
			loading="lazy"
			decoding="async"
			aria-hidden="true"
		/>
	</div>
</template>

<style scoped>
/* Seamless scroll: move the scanline mask by exactly one period (4px). */
@keyframes scanline-scroll {
	from {
		mask-position: 0 0;
		-webkit-mask-position: 0 0;
	}
	to {
		mask-position: 0 4px;
		-webkit-mask-position: 0 4px;
	}
}

.gtl-logo-card {
	position: relative;
	aspect-ratio: 1 / 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 1.25rem;
	border-radius: 1.5rem;
	background: color-mix(in srgb, var(--colors-academy-status-violet) 5%, transparent);
	border: 1px solid var(--colors-academy-border);
	overflow: hidden;
	transition: border-color 250ms ease, background 250ms ease;
}

.gtl-logo-card::before {
	content: "";
	position: absolute;
	inset: 0;
	background: linear-gradient(180deg, color-mix(in srgb, var(--colors-academy-accent-foreground) 4%, transparent), transparent 60%);
	pointer-events: none;
}

/*
 * Scanline mask (2px on / 2px off, 4px period), sized to the padded content
 * area. Everything inside renders only on the "on" rows.
 */
.gtl-logo-duotone {
	position: absolute;
	inset: 1.25rem;
	mask-image: repeating-linear-gradient(
		to bottom,
		black 0px,
		black 2px,
		transparent 2px,
		transparent 4px
	);
	-webkit-mask-image: repeating-linear-gradient(
		to bottom,
		black 0px,
		black 2px,
		transparent 2px,
		transparent 4px
	);
	mask-size: 100% 4px;
	-webkit-mask-size: 100% 4px;
	animation: scanline-scroll 1s linear infinite;
	transition: opacity 350ms ease;
}

/* Duotone logo layers: cyan alpha wash under purple luminance key */
.gtl-logo-mask-cyan,
.gtl-logo-mask-purple {
	position: absolute;
	inset: 0;
	mask-image: var(--icon-url);
	-webkit-mask-image: var(--icon-url);
	mask-repeat: no-repeat;
	-webkit-mask-repeat: no-repeat;
	mask-position: center;
	-webkit-mask-position: center;
	mask-size: contain;
	-webkit-mask-size: contain;
}

.gtl-logo-mask-cyan {
	background-color: var(--colors-academy-accent);
	opacity: 0.28;
	mask-mode: alpha;
	-webkit-mask-mode: alpha;
}

.gtl-logo-mask-purple {
	background-color: var(--colors-academy-status-violet);
	mask-mode: luminance;
	-webkit-mask-mode: luminance;
}

/* Hide the scanline logo (and show the full-colour image) when revealed */
.gtl-logo-card.revealed .gtl-logo-duotone {
	opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
	.gtl-logo-duotone {
		animation: none;
	}
}

/*
 * Full-colour image: hidden during play, fades in on reveal.
 * Give it a stable aspect box (the card itself is 1:1) so there's no layout shift.
 */
.gtl-logo-img {
	position: absolute;
	inset: 1.25rem;
	width: calc(100% - 2.5rem);
	height: calc(100% - 2.5rem);
	object-fit: contain;
	opacity: 0;
	transition: opacity 350ms ease;
	pointer-events: none;
}

.gtl-logo-card.revealed .gtl-logo-img {
	opacity: 1;
}
</style>
