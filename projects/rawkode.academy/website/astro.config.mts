import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import partytown from "@astrojs/partytown";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vue from "@astrojs/vue";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import { defineConfig, envField } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";
import rehypeMermaid from "rehype-mermaid";

export default defineConfig({
	output: "server",
	integrations: [
		expressiveCode({
			themes: ["catppuccin-mocha", "catppuccin-latte"],
		}),
		mdx(),
		react({ experimentalReactChildren: true }),
		sitemap(),
		vue(),
		partytown(),
	],
	vite: {
		plugins: [
			tailwindcss(),
			vue({
				template: {
					compilerOptions: {
						isCustomElement: (tag) => tag.startsWith("media-"),
					},
				},
			}),
		],
		resolve: {
			// Use react-dom/server.edge instead of react-dom/server.browser for React 19.
			// Without this, MessageChannel from node:worker_threads needs to be polyfilled.
			// https://github.com/withastro/adapters/pull/436
			alias: import.meta.env.PROD
				? {
					"react-dom/server": "react-dom/server.edge",
				}
				: {},
		},
	},
	adapter: cloudflare({
		imageService: "cloudflare",
	}),
	site: import.meta.env.CF_PAGES_URL
		? import.meta.env.CF_PAGES_URL
		: "https://rawkode.academy",
	env: {
		validateSecrets: true,
		schema: {
			ZITADEL_URL: envField.string({
				context: "server",
				access: "public",
			}),
			ZITADEL_CLIENT_ID: envField.string({
				context: "server",
				access: "public",
			}),
			INFLUXDB_URL: envField.string({
				context: "server",
				access: "secret",
				optional: true,
			}),
			INFLUXDB_TOKEN: envField.string({
				context: "server",
				access: "secret",
				optional: true,
			}),
			INFLUXDB_ORG: envField.string({
				context: "server",
				access: "public",
				optional: true,
			}),
			INFLUXDB_BUCKET: envField.string({
				context: "server",
				access: "public",
				default: "video-events",
			}),
		},
	},
	security: {
		checkOrigin: true,
	},
	markdown: {
		rehypePlugins: [
			[
				rehypeMermaid,
				{ strategy: "img-svg" },
			],
			[
				rehypeExternalLinks,
				{
					target: "_blank",
				},
			],
		],
	},
});
