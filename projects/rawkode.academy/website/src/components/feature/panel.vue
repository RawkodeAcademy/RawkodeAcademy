<template>
  <div class="bg-white py-24">
									    <div class="mx-auto sm:px-6 lg:px-8">
							      <div class="relative isolate overflow-hidden bg-gray-900 px-6 py-20 sm:rounded-3xl sm:px-10 sm:py-24 lg:py-24 xl:px-24">
							        <div class="mx-auto grid grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:grid-cols-2 lg:items-center lg:gap-y-0">
								          <div class="lg:row-start-2>
            <h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">Boost your productivity.<br />Start using our app today.</h2>
				            <p class="mt-6 text-lg leading-8 text-gray-300">Ac euismod vel sit maecenas id pellentesque eu sed consectetur. Malesuada adipiscing sagittis vel nulla. Ac euismod vel sit maecenas.</p>
				          </div>
					          <img src="https://tailwindui.com/img/component-images/dark-project-app-screenshot.png" alt="Product screenshot" class="relative -z-20 min-w-full rounded-xl shadow-xl ring-1 ring-white/10 lg:row-span-4 lg:w-5xl" width="2432" height="1442" loading="lazy" />
			          <div class="lg:row-start-3 lg:mt-10 lg:border-t lg:border-white/10 lg:pt-10">
			            <dl class="space-y-8 text-base leading-7 text-gray-300">
              <div v-for="feature in features" :key="feature.name" class="relative">
                <dt class="ml-9 inline-block font-semibold text-white">
                  <component :is="feature.icon" class="absolute left-1 top-1 h-5 w-5 text-indigo-500" aria-hidden="true" />
                  {{ feature.name }}
                </dt>
                {{ ' ' }}
                <dd class="inline">{{ feature.description }}</dd>
              </div>
            </dl>
          </div>
        </div>
        <div class="pointer-events-none absolute left-12 top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-3xl lg:-bottom-48 lg:top-auto lg:translate-y-0 lg:transform-gpu" aria-hidden="true">
          <div class="aspect-1155/678 w-288.75 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-25" style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
	CloudArrowUpIcon,
	LockClosedIcon,
	ServerIcon,
} from "@heroicons/vue/20/solid";

const features = [
	{
		name: "Push to deploy.",
		description:
			"Lorem ipsum, dolor sit amet consectetur adipisicing elit aute id magna.",
		icon: CloudArrowUpIcon,
	},
	{
		name: "SSL certificates.",
		description:
			"Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo.",
		icon: LockClosedIcon,
	},
	{
		name: "Database backups.",
		description:
			"Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus.",
		icon: ServerIcon,
	},
];
</script>
