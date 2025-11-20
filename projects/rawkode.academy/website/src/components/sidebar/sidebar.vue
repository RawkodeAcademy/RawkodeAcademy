<script setup lang="ts">
import {
	AcademicCapIcon,
	InformationCircleIcon,
	CalendarIcon,
	ChatBubbleLeftEllipsisIcon,
	CubeIcon,
	MapIcon,
	NewspaperIcon,
	RocketLaunchIcon,
	TvIcon,
	VideoCameraIcon,
	WrenchScrewdriverIcon,
} from "@heroicons/vue/24/outline";
import { computed, onMounted, ref } from "vue";

// Get the current path from the window location
const currentPath = ref("");
const isCollapsed = ref(false);

onMounted(() => {
	currentPath.value = window.location.pathname;

	// Check if we're on mobile (window width < 768px which is md breakpoint)
	const isMobile = window.innerWidth < 768;

	// On mobile, always start collapsed (hidden)
	// On desktop, check localStorage for collapse state
	if (isMobile) {
		isCollapsed.value = true;
	} else {
		const savedState = localStorage.getItem("sidebar-collapsed");
		if (savedState === "true") {
			isCollapsed.value = true;
		}
	}

	// Listen for toggle events from mobile menu button
	window.addEventListener("toggle-sidebar", () => {
		isCollapsed.value = !isCollapsed.value;
		// Only save state on desktop
		if (!isMobile) {
			localStorage.setItem("sidebar-collapsed", String(isCollapsed.value));
		}
	});
});

// Helper function to check if a path matches the current path
function isCurrentPath(itemPath: string) {
	if (itemPath === "/" && currentPath.value === "/") {
		return true;
	}
	return itemPath !== "/" && currentPath.value.startsWith(itemPath);
}

// Navigation sections with unified structure
interface NavItem {
	name: string;
	href: string;
	icon: any;
	current: boolean;
	children?: Array<{ name: string; href: string; current: boolean }>;
}

interface NavSection {
	title: string;
	items: NavItem[];
}

const navigationSections = computed<NavSection[]>(() => [
	{
		title: "Content",
		items: [
			{
				name: "Videos",
				href: "/watch",
				icon: VideoCameraIcon,
				current: isCurrentPath("/watch"),
			},
			{
				name: "Shows",
				href: "/shows",
				icon: TvIcon,
				current: isCurrentPath("/shows"),
			},
			{
				name: "Articles",
				href: "/read",
				icon: NewspaperIcon,
				current: isCurrentPath("/read"),
			},
			{
				name: "Courses",
				href: "/courses",
				icon: AcademicCapIcon,
				current: isCurrentPath("/courses"),
			},
			{
				name: "Learning Paths",
				href: "/learning-paths",
				icon: MapIcon,
				current: isCurrentPath("/learning-paths"),
			},
		],
	},
	{
		title: "Technology",
		items: [
			{
				name: "Explorer",
				href: "/technology",
				icon: CubeIcon,
				current: isCurrentPath("/technology"),
				children: [
					{
						name: "Technology Radar",
						href: "/technology/radar",
						current: isCurrentPath("/technology/radar"),
					},
				],
			},
		],
	},
	{
		title: "Community",
		items: [
			{
				name: "Community Day",
				href: "/community-day",
				icon: CalendarIcon,
				current: isCurrentPath("/community-day"),
			},
		],
	},
	{
		title: "For Organizations",
		items: [
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
				name: "Branding",
				href: "/organizations/branding",
				icon: InformationCircleIcon,
				current: isCurrentPath("/organizations/branding"),
			},
			{
				name: "Let's Chat",
				href: "/organizations/lets-chat",
				icon: ChatBubbleLeftEllipsisIcon,
				current: isCurrentPath("/organizations/lets-chat"),
			},
		],
	},
]);

const toggleCollapse = () => {
	isCollapsed.value = !isCollapsed.value;
	localStorage.setItem("sidebar-collapsed", String(isCollapsed.value));
};
</script>

<template>
	<aside
		class="sidebar-glassmorphism"
		:class="[
			'fixed top-28 left-4 md:left-8 bottom-4 z-30 transition-all duration-300 ease-in-out',
			'rounded-2xl',
			// Desktop: always visible, toggles between collapsed/expanded
			// Mobile: hidden by default (collapsed), shows when expanded (!isCollapsed)
			isCollapsed ? 'hidden md:block md:w-[4.5rem]' : 'block w-64 md:w-72',
		]"
		aria-label="Sidebar navigation"
	>
		<div class="flex flex-col h-full">
			<!-- Navigation with sections -->
			<nav class="flex-1 overflow-y-auto py-4 px-3 scroll-fade">
				<!-- Loop through each section -->
				<div
					v-for="(section, sectionIndex) in navigationSections"
					:key="section.title"
					:class="[
						sectionIndex > 0 ? 'mt-6' : 'mt-2'
					]"
				>
					<!-- Section Header - only show when expanded -->
					<h2
						v-if="!isCollapsed"
						class="px-3 mb-2 text-xs font-semibold tracking-wider uppercase text-gray-500 dark:text-gray-400"
					>
						{{ section.title }}
					</h2>

					<!-- Section Divider - show when collapsed -->
					<div
						v-else-if="sectionIndex > 0"
						class="my-3 mx-auto w-8 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"
					></div>

					<!-- Navigation Items -->
					<ul :class="['space-y-0.5', isCollapsed ? 'pr-1' : '']">
						<li v-for="item in section.items" :key="item.href">
							<a
								:href="item.href"
								:class="[
									'flex items-center text-sm font-medium rounded-xl transition-[background,scale,colors,border] duration-200',
									'group relative will-change-transform border border-transparent w-full',
									isCollapsed
										? 'flex-col items-center justify-center text-center gap-0.5 p-2 text-[0.65rem]'
										: 'px-3 py-2.5 min-h-[44px]',
									item.current
										? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-[0_2px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] backdrop-blur-md border-primary/30'
										: isCollapsed
											? 'text-gray-700 dark:text-gray-100 hover:text-primary dark:hover:text-primary'
											: 'text-gray-700 dark:text-gray-100 hover:bg-white/80 dark:hover:bg-gray-700/80 hover:text-primary hover:scale-[1.02] hover:border-white/30 dark:hover:border-gray-500/50',
								]"
								:aria-current="item.current ? 'page' : undefined"
								:title="isCollapsed ? `${section.title}: ${item.name}` : undefined"
							>
								<component
									:is="item.icon"
									:class="[
										'flex-shrink-0 transition-colors',
										isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3',
										item.current ? 'text-primary' : 'text-gray-500 dark:text-gray-200 group-hover:text-primary',
									]"
								/>
								<span
									:class="[
										'transition-opacity duration-200',
										isCollapsed
											? 'block leading-[1.05] text-center text-[0.6rem] tracking-tight max-w-[3.5rem]'
											: '',
									]"
								>
									{{ item.name }}
								</span>
							</a>

							<!-- Submenu items - only show when on parent route and expanded -->
							<ul
								v-if="item.children && item.children.length > 0 && !isCollapsed && item.current"
								class="mt-2 mb-2 ml-2 mr-1 p-1.5 space-y-0.5 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 dark:border-white/10 shadow-sm relative overflow-hidden"
							>
								<!-- Decorative shine -->
								<div class="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none opacity-50"></div>

								<li v-for="child in item.children" :key="child.href" class="relative z-10">
									<a
										:href="child.href"
										:class="[
											'flex items-center text-xs font-medium rounded-lg px-3 py-2 min-h-[36px] transition-all duration-200',
											child.current
												? 'bg-white dark:bg-white/10 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-semibold'
												: 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-primary',
										]"
										:aria-current="child.current ? 'page' : undefined"
									>
										{{ child.name }}
									</a>
								</li>
							</ul>
						</li>
					</ul>
				</div>
			</nav>
		</div>
	</aside>

	<!-- Mobile Overlay -->
	<div
		v-show="!isCollapsed"
		class="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden"
		@click="toggleCollapse"
		aria-label="Close sidebar"
	></div>
</template>

<style scoped>
.sidebar-glassmorphism {
	background: var(--surface-card);
	backdrop-filter: blur(32px) saturate(170%);
	-webkit-backdrop-filter: blur(32px) saturate(170%);
	border: 1px solid var(--surface-border);
	box-shadow: var(--surface-shadow);
}

.sidebar-glassmorphism::before {
	content: '';
	position: absolute;
	inset: 0;
	background: linear-gradient(to bottom, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.08) 60%, transparent);
	border-radius: inherit;
	pointer-events: none;
	z-index: 1;
}

.sidebar-glassmorphism::after {
	content: '';
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.1) 100%);
	border-radius: inherit;
	pointer-events: none;
	z-index: 1;
}

.sidebar-glassmorphism > * {
	position: relative;
	z-index: 2;
}

/* Subtle fade at top/bottom to hint scrollability */
.scroll-fade {
	-webkit-mask-image: linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 16px), transparent 100%);
	mask-image: linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 16px), transparent 100%);
}
</style>
