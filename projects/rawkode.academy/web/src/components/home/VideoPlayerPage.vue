<template>
    <div class="flex dark:bg-black dark:text-white min-h-screen">
      <!-- Main Content Area -->
      <div class="w-full lg:w-3/4 px-4 py-4">
        <!-- Video Player -->
        <div class="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
          <video ref="videoPlayer" class="w-full h-full" controls autoplay></video>
        </div>
  
        <!-- Video Details -->
        <div class="mt-4">
          <h1 class="text-xl font-bold mb-2">{{ videoTitle }}</h1>
          <div class="flex items-center text-gray-500 text-sm mb-2">
            <span>{{ videoViews }} views</span>
            <span class="mx-2">&bull;</span>
            <span>{{ videoUploadDate }}</span>
          </div>
  
          <!-- Channel Info -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <img
                :src="videoThumbnailUrl"
                alt="Channel Avatar"
                class="rounded-full mr-2 w-10 h-10"
              />
              <div>
                <p class="font-bold">Rawkode Academy</p>
                <p class="text-gray-500 text-sm">12.7K subscribers</p>
              </div>
            </div>
            <button
              class="px-3 py-2 rounded-lg font-semibold transition duration-300 bg-blue-500 text-white hover:bg-blue-600"
            >
              Subscribe
            </button>
          </div>
        </div>
  
        <!-- Video Description -->
        <div class="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm">
          <p>{{ videoDescription }}</p>
        </div>
        <hr class="my-6" />
  
        <!-- Comment Section -->
        <div>
          <h2 class="font-bold text-lg mb-4">{{ comments.length }} Comments</h2>
          <div class="flex items-start mb-6">
            <img
              src="https://via.placeholder.com/40"
              alt="User Avatar"
              class="rounded-full mr-4 w-10 h-10"
            />
            <div class="flex-1">
              <textarea
                v-model="newComment"
                placeholder="Add a comment..."
                class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                rows="2"
              ></textarea>
              <div class="flex justify-end mt-2">
                <button
                  @click="addComment"
                  :disabled="!newComment.trim()"
                  class="px-4 py-2 text-xs rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400"
                >
                  Comment
                </button>
              </div>
            </div>
          </div>
  
          <!-- Display Comments -->
          <div v-for="(comment, index) in comments" :key="index" class="mb-4">
            <div class="flex items-start">
              <img
                src="https://via.placeholder.com/40"
                alt="User Avatar"
                class="rounded-full mr-4 w-10 h-10"
              />
              <div>
                <p class="font-semibold text-sm">{{ comment.username }}</p>
                <p class="text-gray-700 dark:text-gray-400">{{ comment.text }}</p>
                <div class="text-gray-500 text-xs mt-1">1 hour ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Sidebar: Recommended Videos -->
      <div class="hidden lg:block w-1/4 px-4 py-4 border-l dark:border-gray-700">
        <h3 class="font-bold mb-4 mt-0 text-lg">More Videos</h3>
        <div
          v-for="relatedVideo in relatedVideos"
          :key="relatedVideo.id"
          class="flex items-start mb-4 cursor-pointer"
          @click="playRecommendedVideo(relatedVideo)"
        >
          <img
            :src="relatedVideo.thumbnailUrl"
            alt="Thumbnail"
            class="w-32 h-20 object-cover rounded-md mr-2"
            style="min-width: 128px !important;"
          />
          <div>
            <p class="font-medium text-xs mb-1">{{ relatedVideo.title }}</p>
            <p class="text-gray-500 text-xs">Rawkode Academy</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from "vue";
  import { GraphQLClient, gql } from "graphql-request";
  import Hls from "hls.js";
  
  // Props for video ID
  const props = defineProps({
      id: String, // Video ID
      recommendations: Array
  });
  
  // GraphQL Client
  const client = new GraphQLClient("https://api.rawkode.academy/graphql", {
    headers: { "Content-Type": "application/json" },
  });
  
  // State Variables
  const videoPlayer = ref(null);
  const videoTitle = ref("Loading...");
  const videoViews = ref("0");
  const videoUploadDate = ref("");
  const videoDescription = ref("");
  const videoThumbnailUrl = ref("");
  const relatedVideos = ref([]);
  const comments = ref([{ username: "Author", text: "Make sure to subscribe! 🔔" }]);
  const newComment = ref("");
  let hlsInstance = null;
  
  // Fetch Video Details
  const fetchVideoDetails = async () => {
    const query = gql`
      query ($id: String!) {
        videoByID(id: $id) {
          title
          playlistUrl
          thumbnailUrl
          subtitle
        }
      }
    `;
  
    try {
      const { videoByID } = await client.request(query, { id: props.id });
      videoTitle.value = videoByID.title;
      videoThumbnailUrl.value = 'data:image/jpeg;base64,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';
      videoDescription.value = videoByID.subtitle || "No description available.";
      loadVideo(videoByID.playlistUrl);
    } catch (error) {
      console.error("Error fetching video details: ", error);
    }
  };
  
  // Load Video Function
  const loadVideo = (url) => {
    if (!url) return;
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
    if (Hls.isSupported()) {
      hlsInstance = new Hls();
      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(videoPlayer.value);
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => videoPlayer.value.play());
    } else if (videoPlayer.value.canPlayType("application/vnd.apple.mpegurl")) {
      videoPlayer.value.src = url;
      videoPlayer.value.load();
    }
  };
  
  // Add Comment
  const addComment = () => {
    if (newComment.value.trim()) {
      comments.value.push({ username: "You", text: newComment.value.trim() });
      newComment.value = "";
    }
  };

  const scrollToTop = () => {
	// Scroll to top
	window.scrollTo({
		top: 0,
		behavior: "smooth",
	});	
}
  
onMounted(() => {
    scrollToTop()
    fetchVideoDetails()
    relatedVideos.value = props.recommendations || [];
});

 // Play recommended video
const playRecommendedVideo = (video) => {
    scrollToTop()
    videoTitle.value = video.title;
    videoViews.value = video.views;
    videoUploadDate.value = video.uploadDate || "Recently";
    videoDescription.value = "Description for " + video.title;
    loadVideo(video.playlistUrl);
  };
  </script>
  
  <style scoped>
  .aspect-video {
    padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
    position: relative;
  }
  .aspect-video video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }
  </style>
  