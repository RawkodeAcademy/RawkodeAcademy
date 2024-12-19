<template>
	<div class="min-h-screen dark:bg-black dark:text-white">
		<!-- Navigation Bar -->
		<nav
			class="px-4 py-2 flex items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:bg-black dark:border-gray-700"
		>
			<div class="flex items-center flex-1">
				<input
					type="text"
					placeholder="Search"
					class="w-[40%] px-4 py-2 border border-gray-200 dark:bg-gray-900 rounded-l-full dark:border-gray-700 focus:outline-none focus:border-gray-600 h-10"
				/>
				<button
					class="px-6 py-2 dark:bg-gray-800 rounded-r-full border border-l-0 border-gray-200 dark:border-gray-700 h-10 font-medium text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
				>
					<SearchIcon class="h-5 w-5" />
				</button>
				<button
					class="ml-2 p-2 font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
				>
					<MicIcon class="h-5 w-5" />
				</button>
			</div>
			<div class="flex items-center gap-4">
				<button
					class="p-2 font-medium text-gray-900 rounded-full dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
				>
					<VideoIcon class="h-5 w-5" />
				</button>
				<button
					class="p-2 font-medium text-gray-900 rounded-full dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
				>
					<BellIcon class="h-5 w-5" />
				</button>
			</div>
		</nav>

		<!-- Video Grid or VideoPlayerPage -->
		<div v-if="!selectedVideo">
			<!-- Categories -->
			<div class="flex gap-2 p-3 overflow-x-auto categories-scroll">
				<button
					v-for="category in categories"
					:key="category"
					class="px-4 py-1 border border-gray-200 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 rounded-full text-sm whitespace-nowrap dark:hover:bg-gray-800"
				>
					{{ category }}
				</button>
			</div>

			<!-- Video Grid -->
			<div
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 cursor-pointer"
			>
				<!-- Skeleton Loaders -->
				<div
					v-if="loading"
					v-for="n in 9"
					:key="'skeleton-' + n"
					class="rounded-lg overflow-hidden bg-gray-300 dark:bg-gray-700 animate-pulse"
				>
					<div class="aspect-video bg-gray-400 dark:bg-gray-800"></div>
					<div class="p-3">
						<div class="h-4 bg-gray-400 dark:bg-gray-800 rounded mb-2"></div>
						<div class="h-4 bg-gray-400 dark:bg-gray-800 rounded w-3/4"></div>
					</div>
				</div>

				<!-- Videos -->
				<div
					v-else
					v-for="video in videos"
					:key="video.id"
					class="rounded-lg overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-300"
					@click="openVideo(video)"
				>
					<div class="relative">
						<img
							:src="video.thumbnailUrl"
							:alt="video.title"
							class="w-full aspect-video object-cover"
						/>
						<span
							class="absolute bottom-1 right-1 text-white bg-black px-1 rounded text-xs"
						>
							{{ video.title }}
						</span>
					</div>
					<div class="p-3">
						<h3 class="font-medium mb-1">{{ video.title }}</h3>
						<p class="text-gray-400 text-sm">Rawkode Academy</p>
					</div>
				</div>
			</div>

			<!-- Pagination Controls -->
			<div class="flex justify-between items-center mt-6 space-x-4 mx-3">
				<!-- Limit Selector -->
				<div class="flex items-center space-x-2">
					<label
						for="limit"
						class="text-gray-700 dark:text-gray-300 font-semibold"
						>Videos per page:</label
					>
					<select
						id="limit"
						v-model="limit"
						@change="fetchVideos"
						class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400 transition duration-300"
					>
						<option
							v-for="option in [10, 15, 20, 50, 100]"
							:key="option"
							:value="option"
						>
							{{ option }}
						</option>
					</select>
				</div>

				<!-- Pagination Buttons -->
				<div class="flex space-x-4">
					<button
						@click="previousPage"
						:disabled="offset === 0"
						class="px-3 py-2 rounded-lg font-semibold transition duration-300 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 dark:bg-blue-700 dark:hover:bg-blue-800 dark:disabled:bg-gray-600 dark:disabled:text-gray-400 shadow-md hover:shadow-lg disabled:shadow-none"
					>
						← Previous
					</button>
					<button
						@click="nextPage"
						:disabled="!hasMore"
						class="px-3 py-2 rounded-lg font-semibold transition duration-300 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 dark:bg-blue-700 dark:hover:bg-blue-800 dark:disabled:bg-gray-600 dark:disabled:text-gray-400 shadow-md hover:shadow-lg disabled:shadow-none"
					>
						Next →
					</button>
				</div>
			</div>
		</div>

		<!-- Video Player Page -->
		<VideoPlayerPage v-else :id="selectedVideo.id" :recommendations="videos" />
	</div>
</template>

<script setup>
import { SearchIcon, MicIcon, VideoIcon, BellIcon } from "lucide-vue-next";
import { ref, onMounted, watch, nextTick } from "vue";
import Hls from "hls.js";
import { GraphQLClient } from "graphql-request";
import VideoPlayerPage from "./VideoPlayerPage.vue";
const selectedVideo = ref(null);

// Categories
const categories = [
	"All",
	"Music",
	"Haka",
	"News",
	"Mixes",
	"JavaScript",
	"Trailers",
	"Live",
	"Skills",
	"Dramas",
	"Stadiums",
	"Algorithms",
	"Functions",
	"Gadgets",
];

// Reactive state for videos
const videos = ref([]);
const currentVideoUrl = ref(null);
const videoPlayer = ref(null);
let hlsInstance = null;
const isPictureInPicture = ref(false);
const videoError = ref(null);
const loading = ref(true);
const limit = ref(10);
const offset = ref(0);
const hasMore = ref(true);

// GraphQL Client
const client = new GraphQLClient("https://api.rawkode.academy/graphql", {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
	},
});

// GraphQL Query
const GET_VIDEOS = `
  query($limit: Int, $offset: Int) {
    getLatestVideos(limit: $limit, offset: $offset) {
      id
      title
      thumbnailUrl
      playlistUrl
    }
  }
`;

// Fetch videos
const fetchVideos = async () => {
	loading.value = true;
	try {
		const data = await client.request(GET_VIDEOS, {
			limit: limit.value,
			offset: offset.value,
		});
		videos.value = data.getLatestVideos;

		// Check if there are more videos
		hasMore.value = data.getLatestVideos.length === limit.value;
	} catch (error) {
		console.error("Error fetching videos:", error);
	} finally {
		loading.value = false;
	}
};

// Open Video Page
const openVideo = (video) => {
	selectedVideo.value = video;
};

// Scroll to top
const scrollToTop = () => {
	// Scroll to top
	window.scrollTo({
		top: 0,
		behavior: "smooth",
	});
};

// Pagination Methods
const nextPage = () => {
	offset.value += limit.value;
	fetchVideos();
	scrollToTop();
};

const previousPage = () => {
	offset.value = Math.max(0, offset.value - limit.value);
	fetchVideos();
	scrollToTop();
};

watch(limit, () => {
	offset.value = 0;
	fetchVideos();
	scrollToTop();
});

// Fetch videos on component mount
onMounted(async () => {
	fetchVideos();

	// Listen for Picture-in-Picture events
	videoPlayer.value?.addEventListener("enterpictureinpicture", () => {
		console.log("Entered Picture-in-Picture mode.");
		isPictureInPicture.value = true;
	});

	videoPlayer.value?.addEventListener("leavepictureinpicture", () => {
		console.log("Exited Picture-in-Picture mode.");
		isPictureInPicture.value = false;
	});
});

// Watch currentVideoUrl for changes
watch(currentVideoUrl, async (url) => {
	if (!url) return;

	await nextTick();

	if (!videoPlayer.value) return;

	// Destroy existing HLS instance
	if (hlsInstance) {
		hlsInstance.destroy();
		hlsInstance = null;
	}

	// Initialize HLS.js
	if (Hls.isSupported()) {
		hlsInstance = new Hls();
		hlsInstance.loadSource(url);
		hlsInstance.attachMedia(videoPlayer.value);

		hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
			videoPlayer.value.play();
		});

		hlsInstance.on(Hls.Events.ERROR, (event, data) => {
			if (
				data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
				data.response?.code === 404
			) {
				videoError.value =
					"The video you're trying to play could not be found. Please try again later.";
			}
		});
	} else if (videoPlayer.value.canPlayType("application/vnd.apple.mpegurl")) {
		videoPlayer.value.src = url; // Native HLS support
		videoPlayer.value.load();
		videoPlayer.value.onerror = () => {
			videoError.value =
				"The video you're trying to play could not be found. Please try again later.";
		};
	} else {
		console.error("HLS is not supported in this browser.");
	}

	// Add Picture-in-Picture Event Listeners
	videoPlayer.value.addEventListener("enterpictureinpicture", () => {
		isPictureInPicture.value = true;
	});

	videoPlayer.value.addEventListener("leavepictureinpicture", () => {
		isPictureInPicture.value = false;
	});
});

// Play video
const playVideo = async (url) => {
	if (!url) return;

	videoError.value = null; // Reset the error
	// Check if Picture-in-Picture mode is active
	if (document.pictureInPictureElement) {
		try {
			await document.exitPictureInPicture();
		} catch (error) {
			console.error("Error exiting Picture-in-Picture mode:", error);
		}
	}
	currentVideoUrl.value = url;
};

// Close video player
const closePlayer = () => {
	currentVideoUrl.value = null;
	videoError.value = "";

	if (hlsInstance) {
		hlsInstance.destroy();
		hlsInstance = null;
	}
};
</script>

<style scoped>
.categories-scroll {
	scrollbar-width: none;
	-ms-overflow-style: none;
}
.categories-scroll::-webkit-scrollbar {
	display: none;
}

/* Skeleton Animation */
.animate-pulse {
	animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}
</style>
