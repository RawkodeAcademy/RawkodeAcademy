import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import vue from "@astrojs/vue";
import { defineConfig } from "astro/config";
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
	output: "hybrid",
	integrations: [tailwind(), vue(), react()],
	adapter: cloudflare({ mode: "advanced" }),
	markdown: {
		rehypePlugins: [
			[
				rehypeExternalLinks,
				{
					"target": '_blank'
				}
			]
		]
	}
});
