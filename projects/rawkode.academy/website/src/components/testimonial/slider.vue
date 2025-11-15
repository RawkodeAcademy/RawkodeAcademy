<script setup lang="ts">
import { computed } from "vue";

interface TestimonialAuthor {
        name: string;
        title?: string;
        image?: string;
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

const highlight = computed(() => props.testimonials[0]);
const supporting = computed(() => props.testimonials.slice(1));

const getInitials = (name?: string) => {
        if (!name) return "";
        return name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
};
</script>

<template>
        <div class="mt-10">
                <div
                        class="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 snap-x snap-mandatory lg:mx-0 lg:px-0 lg:grid lg:grid-cols-12 lg:gap-6 lg:overflow-visible lg:snap-none"
                >
                        <article
                                v-if="highlight"
                                class="testimonial-card featured min-w-[280px] snap-start lg:col-span-5 lg:min-w-0"
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
                                class="testimonial-card min-w-[240px] snap-start lg:col-span-3 lg:min-w-0"
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
</template>

<style scoped>
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
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 1023px) {
  .testimonial-card.featured::after {
    inset: 1rem;
  }
}

@media (max-width: 640px) {
  .testimonial-card {
    min-height: 220px;
  }
}
</style>
