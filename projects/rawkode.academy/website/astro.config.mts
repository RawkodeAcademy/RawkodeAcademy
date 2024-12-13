import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import vue from "@astrojs/vue";
import { defineConfig, envField } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";

export default defineConfig({
  output: "server",
  integrations: [
    mdx(),
    react({ experimentalReactChildren: true }),
    sitemap(),
    tailwind(),
    vue(),
  ],
  vite: {
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
  site: import.meta.env.DENO
    ? "http://localhost:4321"
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
    },
  },
  security: {
    checkOrigin: true,
  },
  markdown: {
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: "_blank",
        },
      ],
    ],
  },
});
