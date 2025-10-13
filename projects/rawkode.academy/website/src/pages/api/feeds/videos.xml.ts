import { getCollection } from "astro:content";
import { GRAPHQL_ENDPOINT } from "astro:env/server";
import { request, gql } from "graphql-request";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
	const videos = await getCollection("videos");
	const technologies = await getCollection("technologies");
	const techName = new Map(technologies.map((t) => [t.id, t.data.name] as const));

	// Sort by publishedAt desc
	const sortedVideos = videos.sort(
		(a, b) =>
			new Date(b.data.publishedAt).getTime() -
			new Date(a.data.publishedAt).getTime(),
	);

	// Fetch durations map using GraphQL
	let durationMap = new Map<string, number>();
	try {
		const q = gql`query GetMany($limit:Int!){ getLatestVideos(limit:$limit){ slug duration } }`;
		const r: { getLatestVideos: { slug: string; duration: number }[] } = await request(GRAPHQL_ENDPOINT, q, { limit: Math.max(sortedVideos.length, 100) });
		durationMap = new Map(r.getLatestVideos.map((x) => [x.slug, x.duration] as const));
	} catch {}

	return rss({
		title: "Rawkode Academy - Videos",
		description:
			"Latest videos from Rawkode Academy covering Cloud Native, DevOps, and Modern Software Development",
		site: context.site?.toString() || "https://rawkode.academy",
		items: sortedVideos.map((video) => ({
			title: video.data.title,
			description: video.data.description,
			pubDate: new Date(video.data.publishedAt),
			link: `/watch/${video.data.slug}/`,
			customData: `
				<enclosure url="${`https://content.rawkode.academy/videos/${video.data.videoId}/thumbnail.jpg`}" type="image/jpeg" />
				<itunes:duration>${Math.floor(((durationMap.get(video.data.slug) ?? 0) as number) / 60)}:${(
					(durationMap.get(video.data.slug) ?? 0) % 60
				)
					.toString()
					.padStart(2, "0")}</itunes:duration>
				<itunes:image href="${`https://content.rawkode.academy/videos/${video.data.videoId}/thumbnail.jpg`}" />
			`,
			categories: (video.data.technologies as string[]).map((id) => techName.get(id) || id),
		})),
		customData: "<language>en-us</language>",
		stylesheet: false,
		xmlns: {
			itunes: "http://www.itunes.com/dtds/podcast-1.0.dtd",
		},
	});
}
