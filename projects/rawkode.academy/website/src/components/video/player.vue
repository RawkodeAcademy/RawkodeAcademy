<script lang="ts" setup>
import "vidstack/bundle";
import { actions } from "astro:actions";
import { onMounted, ref } from "vue";

const props = defineProps<{
	video: string;
	thumbnailUrl: string;
	autoPlay?: boolean;
}>();

const progressMilestones = ref<Set<number>>(new Set());

type VideoAnalyticsEvent =
	| { action: "played"; video: string; seconds: number }
	| { action: "paused"; video: string; seconds: number }
	| { action: "seeked"; video: string; seconds: number }
	| { action: "completed"; video: string }
	| { action: "progressed"; video: string; percent: number };

async function trackVideoEvent(event: VideoAnalyticsEvent) {
	try {
		await actions.trackVideoEvent(event);
	} catch (error) {
		if (error instanceof Error) {
			console.error("Failed to track video event:", error.message);
		} else {
			console.error("Failed to track video event:", error);
		}
	}
}

onMounted(() => {
	// Get the media player element
	const playerEl = document.querySelector("media-player");
	if (!playerEl) return;

	// Force poster to fill container
	setTimeout(() => {
		// Find the poster image specifically
		const posterImg = playerEl.querySelector('media-poster img') as HTMLImageElement;
		if (posterImg) {
			posterImg.style.objectFit = 'cover';
			posterImg.style.width = '100%';
			posterImg.style.height = '100%';
			posterImg.style.objectPosition = 'center center';
		}
		
		// Also target the media-poster element
		const mediaPoster = playerEl.querySelector('media-poster') as HTMLElement;
		if (mediaPoster) {
			mediaPoster.style.display = 'block';
			mediaPoster.style.width = '100%';
			mediaPoster.style.height = '100%';
		}
	}, 200);

	// Handle media events
	playerEl.addEventListener("play", () => {
		const mediaEl = playerEl.querySelector("video");
		if (!mediaEl) return;

		const event: VideoAnalyticsEvent = {
			action: "played",
			video: props.video,
			seconds: mediaEl.currentTime || 0,
		};
		trackVideoEvent(event);
	});

	playerEl.addEventListener("pause", () => {
		const mediaEl = playerEl.querySelector("video");
		if (!mediaEl) return;

		const event: VideoAnalyticsEvent = {
			action: "paused",
			video: props.video,
			seconds: mediaEl.currentTime || 0,
		};
		trackVideoEvent(event);
	});

	playerEl.addEventListener("seeked", () => {
		const mediaEl = playerEl.querySelector("video");
		if (!mediaEl) return;

		const event: VideoAnalyticsEvent = {
			action: "seeked",
			video: props.video,
			seconds: mediaEl.currentTime || 0,
		};
		trackVideoEvent(event);
	});

	playerEl.addEventListener("ended", () => {
		const event: VideoAnalyticsEvent = {
			action: "completed",
			video: props.video,
		};
		trackVideoEvent(event);
	});

	playerEl.addEventListener("timeupdate", () => {
		const mediaEl = playerEl.querySelector("video");
		if (!mediaEl || !mediaEl.duration) return;

		const progress = Math.floor((mediaEl.currentTime / mediaEl.duration) * 100);

		const milestones = [5, 10, 25, 50, 75, 95];
		for (const milestone of milestones) {
			if (progress >= milestone && !progressMilestones.value.has(milestone)) {
				progressMilestones.value.add(milestone);
				const event: VideoAnalyticsEvent = {
					action: "progressed",
					video: props.video,
					percent: milestone,
				};
				trackVideoEvent(event);
			}
		}
	});
});
</script>

<template>
	<div class="w-full aspect-video">
		<media-player 
			:autoplay="!!autoPlay" 
			class="w-full h-full"
			playsinline
			:style="{ '--media-object-fit': 'cover', '--media-object-position': 'center' }"
		>
			<media-provider>
				<source :src="`https://content.rawkode.academy/videos/${video}/stream.m3u8`" type="application/x-mpegurl" />
				<track :src="`https://content.rawkode.academy/videos/${video}/captions/en.vtt`" kind="subtitles" label="English" lang="en-US" default />
				<track kind="chapters" :src="`/api/chapters/${video}`" label="Chapters" default />
				<media-poster class="vds-poster" :src="thumbnailUrl" :alt="`Thumbnail for ${video}`" fit="cover"></media-poster>
			</media-provider>
			<media-video-layout></media-video-layout>
		</media-player>
	</div>
</template>

<style scoped>
/* Prevent automatic fullscreen on iOS */
:deep(video) {
	-webkit-playsinline: true;
	playsinline: true;
}

/* Ensure video stays in its container on mobile */
:deep(media-player) {
	position: relative !important;
	background-color: transparent !important;
}

/* Fix poster black bars - target all possible selectors */
:deep(.vds-poster),
:deep(media-poster),
:deep(media-poster img),
:deep([data-media-poster]),
:deep(.vds-video-layout media-poster),
:deep(media-provider media-poster) {
	object-fit: cover !important;
	width: 100% !important;
	height: 100% !important;
}

/* Remove any background color from poster container */
:deep(media-poster),
:deep([data-media-poster]) {
	background-color: transparent !important;
}

/* Ensure the provider doesn't have black background */
:deep(media-provider) {
	background-color: transparent !important;
}

/* Override any fullscreen styles on mobile */
@media (max-width: 768px) {
	:deep(video::-webkit-media-controls-fullscreen-button) {
		display: inline-block !important;
	}
	
	:deep(.vds-fullscreen) {
		position: relative !important;
	}
}
</style>

<style>
/* Global styles for Vidstack poster fix */
media-player {
	--media-object-fit: cover !important;
	--media-object-position: center !important;
}

/* Target the video layout background */
.vds-video-layout {
	background-color: transparent !important;
}

/* Ensure no black bars in the buffering container */
.vds-buffering-container {
	background-color: transparent !important;
}

/* Target poster with attribute selector */
[data-media-poster] {
	object-fit: cover !important;
	background-color: transparent !important;
}

/* Video provider background */
[data-media-provider] {
	background-color: transparent !important;
}

/* Ensure video element has no black background */
video {
	background-color: transparent !important;
}

/* Target media-poster img directly */
media-poster img {
	width: 100% !important;
	height: 100% !important;
	object-fit: cover !important;
}
</style>