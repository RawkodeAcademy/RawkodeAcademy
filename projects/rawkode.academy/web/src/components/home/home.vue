<template>
  <div class="min-h-screen bg-black text-white">
    <!-- Navigation Bar -->
    <nav class="px-4 py-2 flex items-center justify-between border-b border-gray-800">
      <div class="flex items-center flex-1">
        <input
          type="text"
          placeholder="Search"
          class="w-[40%] px-4 py-2 bg-gray-900 rounded-l-full border border-gray-700 focus:outline-none focus:border-gray-600 h-10"
        />
        <button class="px-6 py-2 bg-gray-800 rounded-r-full border border-l-0 border-gray-700 h-10">
          <SearchIcon class="h-5 w-5" />
        </button>
        <button class="ml-2 p-2 hover:bg-gray-800 rounded-full">
          <MicIcon class="h-5 w-5" />
        </button>
      </div>
      <div class="flex items-center gap-4">
        <button class="p-2 hover:bg-gray-800 rounded-full">
          <VideoIcon class="h-5 w-5" />
        </button>
        <button class="p-2 hover:bg-gray-800 rounded-full">
          <BellIcon class="h-5 w-5" />
        </button>
      </div>
    </nav>

    <!-- Categories -->
    <div class="flex gap-2 p-3 overflow-x-auto categories-scroll">
      <button 
        v-for="category in categories" 
        :key="category"
        class="px-4 py-1 bg-gray-800 rounded-full text-sm whitespace-nowrap hover:bg-gray-700"
      >
        {{ category }}
      </button>
    </div>

    <!-- Video Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <div 
        v-for="video in videos" 
        :key="video.id"
        class="rounded-lg overflow-hidden hover:bg-gray-800 transition duration-300"
      >
        <div class="relative">
          <img :src="video.thumbnail" :alt="video.title" class="w-full aspect-video object-cover" />
          <span class="absolute bottom-1 right-1 bg-black px-1 rounded text-xs">
            {{ video.duration }}
          </span>
        </div>
        <div class="p-3">
          <h3 class="font-medium mb-1">{{ video.title }}</h3>
          <p class="text-gray-400 text-sm">{{ video.channel }}</p>
          <p class="text-gray-400 text-sm">
            {{ video.views }} views • {{ video.uploadTime }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { SearchIcon, MicIcon, VideoIcon, BellIcon } from 'lucide-vue-next'

const categories = [
  'All',
  'Music',
  'Haka',
  'News',
  'Mixes',
  'JavaScript',
  'Trailers',
  'Live',
  'Skills',
  'Pakistani dramas',
  'Stadiums',
  'Algorithms',
  'Functions',
  'Gadgets'
]

const videos = [
{
  id: 1,
  thumbnail: 'https://plus.unsplash.com/premium_photo-1721979418259-b32d7de74637?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGRlc2VydHxlbnwwfHwwfHx8MA%3D%3D',
  title: 'Mix - Dekhne ko ya Muhammad',
  channel: 'MNGMinhajNaatGroup',
  views: '1.2K',
  uploadTime: 'Updated today',
  duration: '3:45',
},
{
  id: 2,
  thumbnail: 'https://images.unsplash.com/photo-1514996937319-344454492b37?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDR8fHByb2dyYW1taW5nfGVufDB8fDB8fHww',
  title: 'MERN Stack is Dead? (the right full-stack path for 2025)',
  channel: 'Akshay Saini',
  views: '115K',
  uploadTime: '6 days ago',
  duration: '22:16',
},
{
  id: 3,
  thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8bXVzaWN8ZW58MHx8MHx8fDA%3D',
  title: 'Aaj Sajeya | Alaya F | Trending Wedding Song 2021',
  channel: 'Saregama Music',
  views: '43M',
  uploadTime: '3 years ago',
  duration: '4:09',
  },
  {
  id: 4,
  thumbnail: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeZtO1hong-GyGnUaQj6gCcdenhOoaR0pbTX7sCsMTFtTUuT4yooapJbwrenZ-hC6PcZ4&usqp=CAU',
  title: 'Learn Kubernetes in 30 Minutes',
  channel: 'TechWorld with Nana',
  views: '320K',
  uploadTime: '1 year ago',
  duration: '29:45',
},
{
  id: 5,
  thumbnail: 'https://images.unsplash.com/photo-1667372393096-9c864313e868?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzZ8fHByb2dyYW1taW5nJTIwbGFuZ3VhZ2V8ZW58MHx8MHx8fDA%3D',
  title: 'Top 10 Programming Languages for 2024',
  channel: 'Programming with Mosh',
  views: '870K',
  uploadTime: '2 weeks ago',
  duration: '15:34',
},
{
  id: 6,
  thumbnail: 'https://images.unsplash.com/photo-1459499362902-55a20553e082?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fGNvZGluZyUyMGludGVydmlld3xlbnwwfHwwfHx8MA%3D%3D',
  title: 'How to Ace Your Coding Interviews',
  channel: 'Clever Programmer',
  views: '1.1M',
  uploadTime: '3 months ago',
  duration: '18:50',
},
{
  id: 7,
  thumbnail: 'https://media2.dev.to/dynamic/image/width=1600,height=900,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F58dq4jn8lczrttgp2gvo.jpg',
  title: 'Rust vs Go: Which One Should You Learn?',
  channel: 'Fireship',
  views: '650K',
  uploadTime: '4 months ago',
  duration: '12:21',
},
{
  id: 8,
  thumbnail: 'https://cms-cdn.katalon.com/top_devops_tools_e4bd2bfbab.png',
  title: 'Top 5 DevOps Tools for 2024',
  channel: 'DevOps Toolkit',
  views: '95K',
  uploadTime: '5 days ago',
  duration: '10:05',
},
{
  id: 9,
  thumbnail: 'https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fv3o6v5x5rk4mjnpv6spc.png',
  title: 'Building a Web App with Vue 3',
  channel: 'Academind',
  views: '45K',
  uploadTime: '2 weeks ago',
  duration: '25:50',
},
{
  id: 10,
  thumbnail: 'https://i.ytimg.com/vi/sBws8MSXN7A/hqdefault.jpg',
  title: 'CSS Grid vs Flexbox: Which One Should You Use?',
  channel: 'Traversy Media',
  views: '400K',
  uploadTime: '8 months ago',
  duration: '14:45',
},
]
</script>

<style scoped>
.categories-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.categories-scroll::-webkit-scrollbar {
  display: none;
}
</style>