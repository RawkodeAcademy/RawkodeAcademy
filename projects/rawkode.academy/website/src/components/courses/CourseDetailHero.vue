<template>
  <section class="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
    <!-- Animated background pattern -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute inset-0 bg-grid-pattern"></div>
    </div>
    
    <div class="relative z-10 container mx-auto px-4 py-12 md:py-20">
      <!-- Full-width title section -->
      <div class="text-center mb-12">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
          <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <span class="text-green-300 font-medium">Free & Open Source Course</span>
        </div>
        
        <!-- Main headline -->
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight max-w-5xl mx-auto">
          {{ title }}
        </h1>
      </div>
      
      <!-- Content split 50/50 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <!-- Left content -->
        <div>
          <!-- Description -->
          <p class="text-xl text-gray-300 mb-8 leading-relaxed">
            {{ description }}
          </p>
          
          <!-- Key info -->
          <div class="flex flex-wrap items-center gap-6 mb-8 text-gray-300">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <div>
                <div class="text-white font-semibold">{{ moduleCount }} Modules</div>
                <div class="text-gray-500 text-sm">{{ totalDuration }}</div>
              </div>
            </div>
            
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
              <div>
                <div class="text-white font-semibold capitalize">{{ difficulty }}</div>
                <div class="text-gray-500 text-sm">Level</div>
              </div>
            </div>
          </div>
          
          <!-- Course author -->
          <div class="flex items-center gap-4 mb-8">
            <img 
              v-for="author in authors"
              :key="author.handle"
              :src="`https://github.com/${author.handle}.png`" 
              :alt="author.name"
              class="w-12 h-12 rounded-full ring-2 ring-gray-700"
            />
            <div>
              <p class="text-gray-400 text-sm">Taught by</p>
              <div class="text-white font-semibold">
                {{ authors.map(a => a.name).join(', ') }}
              </div>
            </div>
          </div>
          
          <!-- CTA -->
          <div>
            <Button 
              href="#course-content" 
              variant="primary" 
              size="lg"
              class="bg-primary hover:bg-primary-dark text-white font-semibold px-8"
            >
              Start Learning
              <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </Button>
          </div>
        </div>
        
        <!-- Right content - Signup form -->
        <div class="relative">
          <!-- Decorative element -->
          <div class="absolute -top-4 -right-4 w-72 h-72 bg-yellow-500 rounded-full opacity-5 blur-3xl"></div>
          
          <!-- Signup card -->
          <div class="relative bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-white mb-2">Get Course Updates</h3>
              <p class="text-gray-400 text-sm">
                Be the first to know when new modules are released
              </p>
            </div>
            
            <!-- Pass signup config to parent for server-side form -->
            <slot name="signup-form" />
            
            <!-- Benefits -->
            <div class="mt-6 pt-6 border-t border-gray-700">
              <h4 class="text-sm font-semibold text-gray-300 mb-4">What you'll get:</h4>
              <ul class="space-y-3 text-sm text-gray-400">
                <li class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Instant notifications for new modules</span>
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Access to course source code</span>
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Exclusive tips and best practices</span>
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Community support and Q&A</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import Button from "../common/Button.vue";

interface Author {
  name: string;
  handle: string;
}

interface Props {
  title: string;
  description: string;
  moduleCount: number;
  totalDuration: string;
  difficulty: string;
  authors: Author[];
}

defineProps<Props>();
</script>

<style scoped>
.bg-grid-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
</style>