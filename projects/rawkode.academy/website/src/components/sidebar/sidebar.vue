<script setup lang="ts">
import {
	AcademicCapIcon,
	CalendarIcon,
	ChatBubbleLeftEllipsisIcon,
	ChevronDownIcon,
	CubeIcon,
	MapIcon,
	NewspaperIcon,
	RocketLaunchIcon,
	TvIcon,
	VideoCameraIcon,
	WrenchScrewdriverIcon,
	BuildingOfficeIcon,
	AcademicCapIcon as LearnIcon,
} from "@heroicons/vue/24/outline";
import { computed, onMounted, ref } from "vue";

// Get the current path from the window location
const currentPath = ref("");
const isCollapsed = ref(false);
const communityExpanded = ref(false);

// Mode: 'learn' or 'business'
const mode = ref<'learn' | 'business'>('learn');

onMounted(() => {
	currentPath.value = window.location.pathname;

	// Auto-detect mode based on current path
	if (currentPath.value.startsWith("/organizations")) {
		mode.value = 'business';
	}

	// Auto-expand community if on community page
	if (currentPath.value.startsWith("/community-day")) {
		communityExpanded.value = true;
	}

	// Check localStorage for collapse state and mode
	const savedState = localStorage.getItem("sidebar-collapsed");
	if (savedState === "true") {
		isCollapsed.value = true;
	}

	const savedMode = localStorage.getItem("sidebar-mode");
	if (savedMode === 'business' || savedMode === 'learn') {
		mode.value = savedMode;
	}

	// Listen for toggle events from mobile menu button
	window.addEventListener("toggle-sidebar", () => {
		isCollapsed.value = !isCollapsed.value;
		localStorage.setItem("sidebar-collapsed", String(isCollapsed.value));
	});
});

// Helper function to check if a path matches the current path
function isCurrentPath(itemPath: string) {
	if (itemPath === "/" && currentPath.value === "/") {
		return true;
	}
	return itemPath !== "/" && currentPath.value.startsWith(itemPath);
}

// Learn mode navigation items
const learnNavItems = computed(() => [
	{ name: "Videos", href: "/watch", icon: VideoCameraIcon, current: isCurrentPath("/watch") },
	{ name: "Articles", href: "/read", icon: NewspaperIcon, current: isCurrentPath("/read") },
	{ name: "Courses", href: "/courses", icon: AcademicCapIcon, current: isCurrentPath("/courses") },
	{ name: "Learning Paths", href: "/learning-paths", icon: MapIcon, current: isCurrentPath("/learning-paths") },
	{ name: "Technologies", href: "/technology", icon: CubeIcon, current: isCurrentPath("/technology") },
	{ name: "Shows", href: "/shows", icon: TvIcon, current: isCurrentPath("/shows") },
]);

// Business mode navigation items
const businessNavItems = computed(() => [
	{
		name: "Partnerships",
		href: "/organizations/partnerships",
		icon: RocketLaunchIcon,
		current: isCurrentPath("/organizations/partnerships"),
	},
	{
		name: "Consulting",
		href: "/organizations/consulting",
		icon: WrenchScrewdriverIcon,
		current: isCurrentPath("/organizations/consulting"),
	},
	{
		name: "Training",
		href: "/organizations/training",
		icon: AcademicCapIcon,
		current: isCurrentPath("/organizations/training"),
	},
	{
		name: "Let's Chat",
		href: "/organizations/lets-chat",
		icon: ChatBubbleLeftEllipsisIcon,
		current: isCurrentPath("/organizations/lets-chat"),
	},
]);

// Community items (only shown in learn mode)
const communityItems = computed(() => [
	{
		name: "Community Day",
		href: "/community-day",
		icon: CalendarIcon,
		current: isCurrentPath("/community-day"),
	},
	{
		name: "Zulip Chat",
		href: "https://chat.rawkode.academy",
		icon: ChatBubbleLeftEllipsisIcon,
		target: "_blank",
		current: false,
	},
]);

const toggleCollapse = () => {
	isCollapsed.value = !isCollapsed.value;
	localStorage.setItem("sidebar-collapsed", String(isCollapsed.value));
};

const toggleCommunity = () => {
	communityExpanded.value = !communityExpanded.value;
};

const toggleMode = () => {
	mode.value = mode.value === 'learn' ? 'business' : 'learn';
	localStorage.setItem("sidebar-mode", mode.value);
};

const currentNavItems = computed(() => {
	return mode.value === 'learn' ? learnNavItems.value : businessNavItems.value;
});
</script>

<template>
	<aside
		:class="[
			'fixed top-28 left-4 md:left-8 bottom-4 z-30 transition-all duration-300 ease-in-out',
			'bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl',
			'border border-white/40 dark:border-gray-700/40',
			'shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]',
			'before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none before:rounded-2xl',
			'rounded-2xl',
			'hidden md:block',
			isCollapsed ? 'w-16' : 'w-64',
		]"
		aria-label="Sidebar navigation"
	>
		<div class="flex flex-col h-full">
			<!-- Mode Toggle -->
			<div
				v-if="!isCollapsed"
				class="px-3 py-4 border-b border-white/20 dark:border-gray-700/40"
			>
				<div class="flex items-center gap-1 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-xl p-1 border border-white/30 dark:border-gray-600/30 shadow-inner">
					<button
						@click="mode = 'learn'; localStorage.setItem('sidebar-mode', 'learn')"
						:class="[
							'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
							mode === 'learn'
								? 'bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-700/90 dark:to-gray-700/70 text-primary shadow-[0_2px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] backdrop-blur-md'
								: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/40 dark:hover:bg-gray-700/40',
						]"
					>
						<LearnIcon class="w-5 h-5 flex-shrink-0" />
						<span>Learn</span>
					</button>
					<button
						@click="mode = 'business'; localStorage.setItem('sidebar-mode', 'business')"
						:class="[
							'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
							mode === 'business'
								? 'bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-700/90 dark:to-gray-700/70 text-primary shadow-[0_2px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] backdrop-blur-md'
								: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/40 dark:hover:bg-gray-700/40',
						]"
					>
						<BuildingOfficeIcon class="w-5 h-5 flex-shrink-0" />
						<span>Work</span>
					</button>
				</div>
			</div>

			<!-- Mode Toggle (Collapsed) -->
			<div
				v-else
				class="p-2 border-b border-white/20 dark:border-gray-700/40 group relative"
			>
				<button
					@click="toggleMode"
					:class="[
						'w-full flex items-center justify-center p-2 rounded-xl transition-all duration-200',
						mode === 'learn'
							? 'text-primary bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-md shadow-lg border border-primary/30 scale-105'
							: 'text-secondary bg-gradient-to-br from-secondary/20 to-secondary/10 backdrop-blur-md shadow-lg border border-secondary/30 scale-105',
					]"
					:title="mode === 'learn' ? 'Switch to Collaborate Mode' : 'Switch to Learn Mode'"
				>
					<LearnIcon v-if="mode === 'learn'" class="w-6 h-6" />
					<BuildingOfficeIcon v-else class="w-6 h-6" />
				</button>

				<!-- Tooltip -->
				<div
					class="absolute left-full ml-2 px-3 py-2 bg-gray-900/80 dark:bg-gray-700/80 backdrop-blur-xl text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 z-50 top-2 shadow-[0_4px_16px_rgba(0,0,0,0.3)] border border-white/10"
				>
					{{ mode === 'learn' ? 'Switch to Collaborate' : 'Switch to Learn' }}
				</div>
			</div>

			<!-- Navigation -->
			<nav class="flex-1 overflow-y-auto py-6 px-3">
				<!-- Main Navigation -->
				<ul class="space-y-1">
					<li v-for="item in currentNavItems" :key="item.href">
						<a
							:href="item.href"
							:class="[
								'flex items-center text-sm font-medium rounded-xl transition-all duration-200',
								'group relative',
								isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5',
								item.current
									? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-[0_2px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] backdrop-blur-md border border-primary/30'
									: 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:backdrop-blur-md hover:text-primary hover:shadow-lg hover:scale-[1.02] hover:border hover:border-white/30 dark:hover:border-gray-600/30',
							]"
							:aria-current="item.current ? 'page' : undefined"
							:title="isCollapsed ? item.name : undefined"
						>
							<component
								:is="item.icon"
								:class="[
									'flex-shrink-0 transition-colors',
									isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3',
									item.current ? 'text-primary' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary',
								]"
							/>
							<span
								v-show="!isCollapsed"
								class="transition-opacity duration-200"
							>
								{{ item.name }}
							</span>

							<!-- Tooltip for collapsed state -->
							<div
								v-if="isCollapsed"
								class="absolute left-full ml-2 px-3 py-2 bg-gray-900/80 dark:bg-gray-700/80 backdrop-blur-xl text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 z-50 shadow-[0_4px_16px_rgba(0,0,0,0.3)] border border-white/10"
							>
								{{ item.name }}
							</div>
						</a>
					</li>
				</ul>

				<!-- Community Section (Learn Mode Only) -->
				<div v-if="mode === 'learn'" class="mt-6 pt-6 border-t border-white/20 dark:border-gray-700/30">
					<button
						v-if="!isCollapsed"
						@click="toggleCommunity"
						class="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
					>
						<span>Community</span>
						<ChevronDownIcon
							:class="[
								'w-4 h-4 transition-transform duration-200',
								communityExpanded ? 'rotate-180' : '',
							]"
						/>
					</button>

					<div
						v-if="isCollapsed"
						class="h-px bg-white/20 dark:bg-gray-700/30 mb-2"
					></div>

					<Transition
						enter-active-class="transition-all duration-200 ease-out"
						enter-from-class="transform -translate-y-2 opacity-0 max-h-0"
						enter-to-class="transform translate-y-0 opacity-100 max-h-32"
						leave-active-class="transition-all duration-150 ease-in"
						leave-from-class="transform translate-y-0 opacity-100 max-h-32"
						leave-to-class="transform -translate-y-2 opacity-0 max-h-0"
					>
						<ul v-show="communityExpanded || isCollapsed" class="space-y-1 mt-2">
							<li v-for="item in communityItems" :key="item.href">
								<a
									:href="item.href"
									:target="item.target"
									:class="[
										'flex items-center text-sm font-medium rounded-xl transition-all duration-200',
										'group relative',
										isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5',
										item.current
											? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-[0_2px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] backdrop-blur-md border border-primary/30'
											: 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:backdrop-blur-md hover:text-primary hover:shadow-lg hover:scale-[1.02] hover:border hover:border-white/30 dark:hover:border-gray-600/30',
									]"
									:title="isCollapsed ? item.name : undefined"
								>
									<component
										:is="item.icon"
										:class="[
											'flex-shrink-0 transition-colors',
											isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3',
											item.current
												? 'text-primary'
												: 'text-gray-500 dark:text-gray-400 group-hover:text-primary',
										]"
									/>
									<span
										v-show="!isCollapsed"
										class="transition-opacity duration-200"
									>
										{{ item.name }}
									</span>

									<!-- Tooltip for collapsed state -->
									<div
										v-if="isCollapsed"
										class="absolute left-full ml-2 px-3 py-2 bg-gray-900/80 dark:bg-gray-700/80 backdrop-blur-xl text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 z-50 shadow-[0_4px_16px_rgba(0,0,0,0.3)] border border-white/10"
									>
										{{ item.name }}
										<span v-if="item.target === '_blank'" class="ml-1">→</span>
									</div>
								</a>
							</li>
						</ul>
					</Transition>
				</div>
			</nav>

			<!-- Footer Links -->
			<div
				v-if="!isCollapsed"
				class="border-t border-white/20 dark:border-gray-700/40 px-3 py-4"
			>
				<div class="space-y-1">
					<a
						href="/about"
						class="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/60 hover:backdrop-blur-md hover:shadow-md hover:scale-[1.02] hover:border hover:border-white/30 dark:hover:border-gray-600/30 transition-all duration-200"
					>
						About
					</a>
					<a
						href="/changelog"
						class="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/60 hover:backdrop-blur-md hover:shadow-md hover:scale-[1.02] hover:border hover:border-white/30 dark:hover:border-gray-600/30 transition-all duration-200"
					>
						Changelog
					</a>
				</div>
			</div>
		</div>
	</aside>

	<!-- Mobile Overlay -->
	<div
		v-show="!isCollapsed"
		class="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden"
		@click="toggleCollapse"
	></div>
</template>
