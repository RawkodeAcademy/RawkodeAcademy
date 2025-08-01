import type { CollectionEntry } from "astro:content";
import type { ImageServicePayload } from "./image-service";

export interface OpenGraphProps {
	title: string;
	subtitle?: string | undefined;
	description?: string | undefined;
	useImageDirectly?: boolean | undefined;
	image?: Partial<ImageServicePayload> | undefined;
	isArticle?: boolean | undefined;
	publishedAt?: Date | undefined;
	updatedAt?: Date | undefined;
	authors?: CollectionEntry<"people">[] | undefined;
}
