<script setup lang="ts">
import { computed, ref } from "vue";

interface TestimonialAuthor {
        name: string;
        title: string;
        image: string;
        link?: string;
}

interface Props {
        testimonials: {
                quote: string;
                author: TestimonialAuthor;
        }[];
}

const props = withDefaults(defineProps<Props>(), {
        testimonials: () => [],
});

// Mobile carousel state
const currentIndex = ref(0);

// For desktop grid layout
const highlight = computed(() => props.testimonials[0]);
const supporting = computed(() => props.testimonials.slice(1));

const getInitials = (name?: string) => {
        if (!name) return "";
        return name
                .split(" ")
                .filter(part => part.length > 0)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
};

const nextTestimonial = () => {
        currentIndex.value = (currentIndex.value + 1) % props.testimonials.length;
};

const prevTestimonial = () => {
        currentIndex.value = (currentIndex.value - 1 + props.testimonials.length) % props.testimonials.length;
};

const goToTestimonial = (index: number) => {
        currentIndex.value = index;
};

const currentTestimonial = computed(() => props.testimonials[currentIndex.value]);
</script>

<template>
        <div class="mt-10">
                <!-- Mobile: Single card carousel -->
                <div class="lg:hidden">
                        <div class="relative px-4">
                                <!-- Carousel card -->
                                <article v-if="currentTestimonial" class="testimonial-card-mobile">
                                        <svg
                                                aria-hidden="true"
                                                class="h-8 w-8 text-primary/60 mb-4"
                                                viewBox="0 0 48 48"
                                                fill="currentColor"
                                        >
                                                <path
                                                        d="M17.76 7C10.42 7 5 12.84 5 20.3c0 4.93 2.65 8.12 5.8 10.14l-4.48 10.9c-.17.42.25.86.68.7l6.8-2.44c.17-.06.3-.2.36-.37l1.16-3.36c.05-.15.18-.26.34-.29l1.98-.34c5.97-1.02 10.38-6.58 10.38-12.94C27.82 12.84 23.09 7 17.76 7Zm20.22 0C30.64 7 25.22 12.84 25.22 20.3c0 4.93 2.65 8.12 5.8 10.14l-4.48 10.9c-.17.42.25.86.68.7l6.8-2.44c.17-.06.3-.2.36-.37l1.16-3.36c.05-.15.18-.26.34-.29l1.98-.34c5.97-1.02 10.38-6.58 10.38-12.94C47.04 12.84 42.31 7 37.98 7Z"
                                                />
                                        </svg>
                                        <p class="text-base leading-relaxed text-gray-800 dark:text-gray-100 mb-6 line-clamp-4">
                                                {{ currentTestimonial.quote }}
                                        </p>
                                        <div class="flex items-center gap-3">
                                                <template v-if="currentTestimonial.author.image">
                                                        <img
                                                                :src="currentTestimonial.author.image"
                                                                :alt="`${currentTestimonial.author.name} profile picture`"
                                                                class="h-12 w-12 rounded-full object-cover border-2 border-primary/60"
                                                                loading="lazy"
                                                        />
                                                </template>
                                                <template v-else>
                                                        <div
                                                                class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-semibold text-white"
                                                                :aria-label="`${currentTestimonial.author.name} avatar`"
                                                        >
                                                                {{ getInitials(currentTestimonial.author.name) }}
                                                        </div>
                                                </template>
                                                <div>
                                                        <a
                                                                v-if="currentTestimonial.author.link"
                                                                class="no-underline text-base font-semibold text-gray-900 transition hover:text-primary dark:text-white"
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                :href="currentTestimonial.author.link"
                                                        >
                                                                {{ currentTestimonial.author.name }}
                                                        </a>
                                                        <p v-else class="text-base font-semibold text-gray-900 dark:text-white">
                                                                {{ currentTestimonial.author.name }}
                                                        </p>
                                                        <p class="text-sm text-gray-500 dark:text-gray-400">
                                                                {{ currentTestimonial.author.title }}
                                                        </p>
                                                </div>
                                        </div>
                                </article>

                                <!-- Navigation arrows -->
                                <button
                                        @click="prevTestimonial"
                                        class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition z-10"
                                        aria-label="Previous testimonial"
                                >
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                        </svg>
                                </button>
                                <button
                                        @click="nextTestimonial"
                                        class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition z-10"
                                        aria-label="Next testimonial"
                                >
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                </button>
                        </div>

                        <!-- Dots navigation -->
                        <div class="flex justify-center gap-2 mt-6">
                                <button
                                        v-for="(_, index) in testimonials"
                                        :key="index"
                                        @click="goToTestimonial(index)"
                                        class="w-2 h-2 rounded-full transition"
                                        :class="index === currentIndex ? 'bg-primary w-8' : 'bg-gray-400 dark:bg-gray-600'"
                                        :aria-label="`Go to testimonial ${index + 1}`"
                                />
                        </div>
                </div>

                <!-- Desktop: Grid layout -->
                <div class="hidden lg:block">
                        <div class="grid grid-cols-12 gap-6">
                                <article
                                        v-if="highlight"
                                        class="testimonial-card featured col-span-5"
                                >
                                        <div class="flex h-full flex-col gap-6">
                                                <svg
                                                        aria-hidden="true"
                                                        class="h-10 w-10 text-primary/60"
                                                        viewBox="0 0 48 48"
                                                        fill="currentColor"
                                                >
                                                        <path
                                                                d="M17.76 7C10.42 7 5 12.84 5 20.3c0 4.93 2.65 8.12 5.8 10.14l-4.48 10.9c-.17.42.25.86.68.7l6.8-2.44c.17-.06.3-.2.36-.37l1.16-3.36c.05-.15.18-.26.34-.29l1.98-.34c5.97-1.02 10.38-6.58 10.38-12.94C27.82 12.84 23.09 7 17.76 7Zm20.22 0C30.64 7 25.22 12.84 25.22 20.3c0 4.93 2.65 8.12 5.8 10.14l-4.48 10.9c-.17.42.25.86.68.7l6.8-2.44c.17-.06.3-.2.36-.37l1.16-3.36c.05-.15.18-.26.34-.29l1.98-.34c5.97-1.02 10.38-6.58 10.38-12.94C47.04 12.84 42.31 7 37.98 7Z"
                                                        />
                                                </svg>
                                                <p class="text-xl leading-relaxed text-gray-800 dark:text-gray-100 lg:text-2xl">
                                                        {{ highlight.quote }}
                                                </p>
                                                <div class="mt-auto flex items-center gap-4 pt-2">
                                                        <template v-if="highlight.author.image">
                                                                <img
                                                                        :src="highlight.author.image"
                                                                        :alt="`${highlight.author.name} profile picture`"
                                                                        class="h-16 w-16 rounded-full object-cover border-2 border-primary/60 shadow-lg"
                                                                        loading="lazy"
                                                                />
                                                        </template>
                                                        <template v-else>
                                                                <div
                                                                        class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xl font-semibold text-white"
                                                                        :aria-label="`${highlight.author.name} avatar`"
                                                                >
                                                                        {{ getInitials(highlight.author.name) }}
                                                                </div>
                                                        </template>
                                                        <div>
                                                                <a
                                                                        v-if="highlight.author.link"
                                                                        class="no-underline text-lg font-semibold text-gray-900 transition hover:text-primary dark:text-white"
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        :href="highlight.author.link"
                                                                >
                                                                        {{ highlight.author.name }}
                                                                </a>
                                                                <p v-else class="text-lg font-semibold text-gray-900 dark:text-white">
                                                                        {{ highlight.author.name }}
                                                                </p>
                                                                <p class="text-sm text-gray-500 dark:text-gray-400">
                                                                        {{ highlight.author.title }}
                                                                </p>
                                                        </div>
                                                </div>
                                        </div>
                                </article>

                                <article
                                        v-for="(testimonial, index) in supporting"
                                        :key="`support-${index}`"
                                        class="testimonial-card col-span-3"
                                >
                                        <p class="supporting-quote text-base leading-relaxed text-gray-700 dark:text-gray-200">
                                                {{ testimonial.quote }}
                                        </p>
                                        <div class="mt-6 flex items-center gap-4">
                                                <template v-if="testimonial.author.image">
                                                        <img
                                                                :src="testimonial.author.image"
                                                                :alt="`${testimonial.author.name} profile picture`"
                                                                class="h-12 w-12 rounded-full object-cover border border-primary/40"
                                                                loading="lazy"
                                                        />
                                                </template>
                                                <template v-else>
                                                        <div
                                                                class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-secondary/80 text-sm font-semibold text-white"
                                                                :aria-label="`${testimonial.author.name} avatar`"
                                                        >
                                                                {{ getInitials(testimonial.author.name) }}
                                                        </div>
                                                </template>
                                                <div>
                                                        <a
                                                                v-if="testimonial.author.link"
                                                                class="no-underline text-base font-semibold text-gray-900 transition hover:text-primary dark:text-white"
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                :href="testimonial.author.link"
                                                        >
                                                                {{ testimonial.author.name }}
                                                        </a>
                                                        <p v-else class="text-base font-semibold text-gray-900 dark:text-white">
                                                                {{ testimonial.author.name }}
                                                        </p>
                                                        <p class="text-sm text-gray-500 dark:text-gray-400">
                                                                {{ testimonial.author.title }}
                                                        </p>
                                                </div>
                                        </div>
                                </article>
                        </div>
                </div>
        </div>
</template>

<style scoped>
/* Mobile carousel card */
.testimonial-card-mobile {
  background: radial-gradient(
        circle at top left,
        rgba(var(--brand-secondary), 0.12),
        transparent 55%
      ),
    rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 24px;
  padding: 1.25rem;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px);
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.dark .testimonial-card-mobile {
  background: radial-gradient(
        circle at top left,
        rgba(var(--brand-primary), 0.18),
        transparent 55%
      ),
    rgba(15, 23, 42, 0.75);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
}

/* Desktop grid cards */
.testimonial-card {
  background: radial-gradient(
        circle at top left,
        rgba(var(--brand-secondary), 0.12),
        transparent 55%
      ),
    rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 28px;
  padding: 1.5rem;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.dark .testimonial-card {
  background: radial-gradient(
        circle at top left,
        rgba(var(--brand-primary), 0.18),
        transparent 55%
      ),
    rgba(15, 23, 42, 0.75);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
}

.testimonial-card.featured {
  padding: 2rem;
  position: relative;
}

.testimonial-card.featured::after {
  content: "";
  position: absolute;
  inset: 1.5rem;
  border-radius: 24px;
  border: 1px dashed rgba(var(--brand-primary), 0.25);
  pointer-events: none;
}

.supporting-quote {
  display: -webkit-box;
  -webkit-line-clamp: 6;
  line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
