import { defineCollection, z } from "astro:content";

const authorCollection = defineCollection({
  schema: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

const articleCollection = defineCollection({
  schema: z.object({
    isDraft: z.boolean().default(false),
    title: z.string(),
    banner: z.string().optional(),
    authors: z.array(z.string()).default(["Anonymous"]),
    profileImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    publishDate: z.string().transform((str) => new Date(str)),
    role: z.string().optional(),
  }),
});

export const collections = {
  articles: articleCollection,
  authors: authorCollection,
};
