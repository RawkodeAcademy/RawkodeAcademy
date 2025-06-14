<script setup lang="ts">
import { Carousel, Slide, Pagination, Navigation } from "vue3-carousel";
import "vue3-carousel/dist/carousel.css";

// Use a more permissive type definition by using a Record type
interface Props {
	testimonials: {
		quote: string;
		author: Record<string, any>;
	}[];
}

defineProps<Props>();
</script>

<template>
	<Carousel :autoplay="5000" :wrap-around="true" :items-to-show="1" :pause-autoplay-on-hover="true"
		class="testimonial-carousel">
		<Slide v-for="(testimonial, index) in testimonials" :key="index">
			<div class="text-gray-900 dark:text-gray-100" style="padding: var(--spacing-4);">
				<div
					class="relative max-w-3xl mx-auto rounded-2xl bg-linear-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
					style="padding: var(--spacing-8);">
					<blockquote>
						<p
							class="relative text-xl font-medium leading-relaxed text-gray-800 dark:text-gray-100 text-center z-10"
							style="margin-bottom: var(--spacing-6); padding-left: var(--spacing-6); padding-right: var(--spacing-6);">
							{{ testimonial.quote }}
						</p>
					</blockquote>
					<div class="flex items-center justify-center border-t border-gray-200 dark:border-gray-700" 
						 style="margin-top: var(--spacing-8); padding-top: var(--spacing-6);">
						<div class="shrink-0" style="margin-right: var(--spacing-4);">
							<img :src="testimonial.author.image" :alt="`${testimonial.author.name} profile picture`"
								class="w-12 h-12 rounded-full object-cover border-2 border-primary shadow-sm ring-2 ring-white dark:ring-gray-800" />
						</div>
						<div class="flex flex-col">
							<a v-if="testimonial.author.link" target="_blank" :href="testimonial.author.link"
								class="no-underline transition-opacity hover:opacity-80 duration-[--duration-fast]">
								<div class="font-semibold text-gray-900 dark:text-white" style="margin-bottom: var(--spacing-1);">{{ testimonial.author.name }}</div>
								<div class="text-sm text-gray-500 dark:text-gray-400">{{ testimonial.author.title }}</div>
							</a>
							<div v-else>
								<div class="font-semibold text-gray-900 dark:text-white" style="margin-bottom: var(--spacing-1);">{{ testimonial.author.name }}</div>
								<div class="text-sm text-gray-500 dark:text-gray-400">{{ testimonial.author.title }}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Slide>

		<template #addons>
			<Navigation />
			<Pagination />
		</template>
	</Carousel>
</template>

<style>
/* Customize carousel navigation with design tokens */
.carousel__prev,
.carousel__next {
  background-color: var(--color-primary) !important;
  border-radius: 9999px !important;
  width: 3rem !important;
  height: 3rem !important;
  margin: 0 var(--spacing-4) !important;
  opacity: 0.9 !important;
  transition: all var(--duration-fast) ease !important;
  box-shadow: var(--shadow-card) !important;
}

.carousel__prev:hover,
.carousel__next:hover {
  background-color: var(--color-primary-hover) !important;
  opacity: 1 !important;
  transform: scale(1.05) !important;
}

.carousel__icon {
  filter: brightness(10) !important;
}

/* Customize pagination with design tokens */
.carousel__pagination {
  margin-top: var(--spacing-8) !important;
}

.carousel__pagination-button {
  width: 0.75rem !important;
  height: 0.75rem !important;
  border-radius: 50% !important;
  background-color: #d1d5db !important; /* gray-300 */
  margin: 0 var(--spacing-1) !important;
  transition: all var(--duration-fast) ease !important;
}

.carousel__pagination-button--active {
  background-color: var(--color-primary) !important;
  transform: scale(1.2) !important;
}

.dark .carousel__pagination-button {
  background-color: #4b5563 !important; /* gray-600 */
}

.dark .carousel__pagination-button--active {
  background-color: var(--color-primary) !important;
}

/* Responsive adjustments with design tokens */
@media (max-width: 768px) {
  .carousel__prev,
  .carousel__next {
    width: 2.5rem !important;
    height: 2.5rem !important;
    margin: 0 var(--spacing-2) !important;
  }
}

@media (max-width: 640px) {
  .carousel__prev,
  .carousel__next {
    display: none !important;
  }
}
</style>
