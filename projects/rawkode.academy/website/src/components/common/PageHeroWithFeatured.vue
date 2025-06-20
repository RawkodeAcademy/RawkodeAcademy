<template>
  <section class="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
    <!-- Background decoration -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-purple-200 dark:bg-purple-900 rounded-full opacity-20 blur-3xl"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200 dark:bg-blue-900 rounded-full opacity-20 blur-3xl"></div>
    </div>
    
    <!-- Grid pattern overlay -->
    <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
    
    <div class="relative z-10 container mx-auto px-4 py-12 md:py-16">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <!-- Left side - Text content -->
        <div class="max-w-2xl">
          <!-- Badge/Category -->
          <div v-if="badge" class="mb-4">
            <Badge variant="primary" size="md">{{ badge }}</Badge>
          </div>
          
          <!-- Title -->
          <Heading
            as="h1"
            size="3xl"
            :align="compact ? 'left' : 'center'"
            weight="extrabold"
            class="mb-4 lg:text-left"
          >
            {{ title }}
          </Heading>
          
          <!-- Subtitle/Description -->
          <p v-if="subtitle" class="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed lg:text-left">
            {{ subtitle }}
          </p>
          
          <!-- Stats/Metadata -->
          <div v-if="stats && stats.length > 0" class="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 lg:justify-start">
            <div v-for="(stat, index) in stats" :key="index" class="flex items-center gap-2">
              <component
                v-if="stat.icon"
                :is="stat.icon"
                class="w-5 h-5"
              />
              <span>{{ stat.label }}</span>
            </div>
          </div>
        </div>
        
        <!-- Right side - Featured article -->
        <div v-if="featuredArticle" class="relative">
          <div class="absolute -inset-4 bg-gradient-to-r from-primary to-secondary rounded-xl opacity-20 blur-xl"></div>
          <a 
            :href="`/read/${featuredArticle.id}`" 
            class="relative block rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl border border-gray-200 dark:border-gray-700"
          >
            <!-- Featured badge -->
            <div class="absolute top-4 left-4 z-20">
              <span class="px-3 py-1 text-xs font-semibold rounded-full bg-primary text-white shadow-lg backdrop-blur-sm">
                Latest Article
              </span>
            </div>
            
            <!-- Article image/background -->
            <div class="relative h-64 lg:h-80">
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>
              <div v-if="featuredArticle.data.cover" class="absolute inset-0">
                <img
                  :src="featuredArticle.data.cover.image.src"
                  :alt="featuredArticle.data.cover.alt"
                  class="w-full h-full object-cover"
                />
              </div>
              <div v-else class="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/40"></div>
            </div>
            
            <!-- Article content -->
            <div class="absolute bottom-0 left-0 right-0 p-6 z-20">
              <h3 class="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2">
                {{ featuredArticle.data.title }}
              </h3>
              
              <p v-if="featuredArticle.data.openGraph?.subtitle" class="text-gray-200 text-sm md:text-base mb-3 line-clamp-2">
                {{ featuredArticle.data.openGraph.subtitle }}
              </p>
              
              <div class="flex items-center justify-between">
                <div v-if="featuredAuthors && featuredAuthors.length > 0" class="flex items-center">
                  <div class="flex -space-x-2">
                    <div v-for="author in featuredAuthors.slice(0, 3)" :key="author.id" class="relative">
                      <img
                        class="w-6 h-6 rounded-full object-cover border-2 border-white"
                        :src="`https://github.com/${author.data.handle}.png`"
                        :alt="`Profile picture of ${author.data.name}`"
                      />
                    </div>
                  </div>
                  <span class="ml-2 text-xs text-white/90">
                    By {{ featuredAuthors.map(a => a.data.name).join(", ") }}
                  </span>
                </div>
                
                <div class="flex items-center text-white/80 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ formatDate(featuredArticle.data.publishedAt) }}
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
    
    <!-- Bottom wave decoration -->
    <div class="absolute bottom-0 left-0 right-0">
      <svg
        class="w-full h-8 md:h-16 text-white dark:text-gray-800"
        preserveAspectRatio="none"
        viewBox="0 0 1440 64"
        fill="currentColor"
      >
        <path d="M0,32L48,37.3C96,43,192,53,288,56C384,59,480,53,576,48C672,43,768,37,864,32C960,27,1056,21,1152,21.3C1248,21,1344,27,1392,29.3L1440,32L1440,64L1392,64C1344,64,1248,64,1152,64C1056,64,960,64,864,64C768,64,672,64,576,64C480,64,384,64,288,64C192,64,96,64,48,64L0,64Z"></path>
      </svg>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import type { CollectionEntry } from "astro:content";
import Badge from "./Badge.vue";
import Heading from "./Heading.vue";

interface Stat {
	icon?: Component;
	label: string;
}

interface Props {
	title: string;
	subtitle?: string | undefined;
	badge?: string | undefined;
	stats?: Stat[] | undefined;
	featuredArticle?: CollectionEntry<"articles"> | undefined;
	featuredAuthors?: CollectionEntry<"people">[] | undefined;
	compact?: boolean | undefined;
}

defineProps<Props>();

function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(date);
}
</script>

<style scoped>
.bg-grid-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
</style>