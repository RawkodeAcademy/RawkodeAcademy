<script setup lang="ts">
import { initFlowbite } from "flowbite";
import { onMounted, ref, computed } from "vue";
import MenuItems from "./items.vue";
import {
	InformationCircleIcon,
	NewspaperIcon,
	RocketLaunchIcon,
	VideoCameraIcon,
	CalendarIcon,
	WrenchScrewdriverIcon,
	AcademicCapIcon,
	CubeIcon,
	DocumentTextIcon,
	ClockIcon,
	ChevronDownIcon,
	ChevronRightIcon,
} from "@heroicons/vue/24/outline";
import { ChatBubbleLeftEllipsisIcon } from "@heroicons/vue/20/solid";

// Get the current path from the window location
const currentPath = ref("");

// Collapsible section states
const sectionsExpanded = ref({
	community: false,
});

onMounted(() => {
	currentPath.value = window.location.pathname;
	initFlowbite();
	
	// Auto-expand sections if they contain the current page
	if (currentPath.value.startsWith('/community-day') || currentPath.value.includes('chat.rawkode')) {
		sectionsExpanded.value.community = true;
	}
});

// Toggle section expansion
const toggleSection = (section: keyof typeof sectionsExpanded.value) => {
	sectionsExpanded.value[section] = !sectionsExpanded.value[section];
};

// Main navigation - core learning content
const baseMenuItemsMain = [
	{ name: "Articles", href: "/read", icon: NewspaperIcon },
	{ name: "Videos", href: "/watch", icon: VideoCameraIcon },
	{ name: "Courses", href: "/courses", icon: AcademicCapIcon },
	{ name: "Technologies", href: "/technology", icon: CubeIcon },
];

// Community items
const baseMenuItemsCommunity = [
	{ name: "Community Day", href: "/community-day", icon: CalendarIcon },
	{ name: "Zulip Chat", href: "https://chat.rawkode.academy", icon: ChatBubbleLeftEllipsisIcon, target: "_blank" },
];

// Footer items - always visible at bottom
const baseMenuItemsFooter = [
	{ name: "About", href: "/about", icon: InformationCircleIcon },
	{ name: "Changelog", href: "/changelog", icon: ClockIcon },
];

const baseMenuItemsOrgs = [
	{
		name: "Partnerships",
		href: "/organizations/partnerships",
		icon: RocketLaunchIcon,
	},
	{
		name: "Consulting",
		href: "/organizations/consulting",
		icon: WrenchScrewdriverIcon,
	},
	{
		name: "Training",
		href: "/organizations/training",
		icon: AcademicCapIcon,
	},
];

// Compute the menu items with the current property based on the current path
const menuItemsMain = computed(() => {
	return baseMenuItemsMain.map((item) => ({
		...item,
		current: isCurrentPath(item.href),
	}));
});

const menuItemsCommunity = computed(() => {
	return baseMenuItemsCommunity.map((item) => ({
		...item,
		current: isCurrentPath(item.href),
	}));
});

const menuItemsFooter = computed(() => {
	return baseMenuItemsFooter.map((item) => ({
		...item,
		current: isCurrentPath(item.href),
	}));
});

const menuItemsOrgs = computed(() => {
	return baseMenuItemsOrgs.map((item) => ({
		...item,
		current: isCurrentPath(item.href),
	}));
});

// Helper function to check if a path matches the current path
function isCurrentPath(itemPath: string) {
	// Special case for home page
	if (itemPath === "/" && currentPath.value === "/") {
		return true;
	}

	// For other pages, check if the current path starts with the item path
	// This handles nested routes (e.g. /read/some-post should highlight the article)
	return itemPath !== "/" && currentPath.value.startsWith(itemPath);
}
</script>

<template>
	<aside class="fixed top-0 left-0 z-40 w-64 h-screen pt-14 transition-transform -translate-x-full md:translate-x-0
		bg-linear-to-br from-white to-gray-50 dark:from-black dark:to-gray-900
		border-r border-gray-200 dark:border-gray-700 shadow-lg shadow-gray-100/10 dark:shadow-black/20" aria-label="Sidenav"
		id="drawer-navigation">
		<div class="overflow-y-auto py-5 px-4 h-full flex flex-col">

			<!-- Main navigation - always visible -->
			<ul class="space-y-1.5">
				<MenuItems :menuItems="menuItemsMain" />
			</ul>
			
			<!-- For Organizations - promoted and always visible -->
			<div class="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
				<div
					class="text-xs font-semibold leading-6 px-2 mb-2 bg-clip-text text-transparent bg-linear-to-r from-primary to-tertiary">
					For Organizations
				</div>
				<ul class="space-y-1.5">
					<MenuItems :menuItems="menuItemsOrgs" />
				</ul>
			</div>
			
			<!-- Community - Collapsible -->
			<div class="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
				<button 
					@click="toggleSection('community')"
					class="flex items-center justify-between w-full px-2 mb-2 text-xs font-semibold leading-6 
					       text-left cursor-pointer hover:opacity-80 transition-opacity">
					<span class="bg-clip-text text-transparent bg-linear-to-r from-primary to-secondary">Community</span>
					<component 
						:is="sectionsExpanded.community ? ChevronDownIcon : ChevronRightIcon" 
						class="w-3 h-3 text-gray-500 dark:text-gray-400"
					/>
				</button>
				<Transition
					enter-active-class="transition duration-200 ease-out"
					enter-from-class="transform scale-95 opacity-0"
					enter-to-class="transform scale-100 opacity-100"
					leave-active-class="transition duration-150 ease-in"
					leave-from-class="transform scale-100 opacity-100"
					leave-to-class="transform scale-95 opacity-0">
					<ul v-show="sectionsExpanded.community" class="space-y-1.5">
						<MenuItems :menuItems="menuItemsCommunity" />
					</ul>
				</Transition>
			</div>
			
			<!-- Spacer to push footer items to bottom -->
			<div class="flex-1"></div>
			
			<!-- Footer items - always visible at bottom -->
			<div class="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
				<ul class="space-y-1.5">
					<MenuItems :menuItems="menuItemsFooter" />
				</ul>
			</div>
		</div>
	</aside>
</template>
