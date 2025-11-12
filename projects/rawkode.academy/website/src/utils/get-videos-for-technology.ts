import { getCollection } from "astro:content";

/**
 * Fetches videos associated with a specific technology.
 * @param technologyId - The ID of the technology
 * @returns Array of videos with their metadata
 */
export async function getVideosForTechnology(technologyId: string) {
	try {
		// Normalize technology ID to match the reference format used in the schema
		const technologyRef = `${technologyId}/index`;

		const allVideos = await getCollection("videos", ({ data }) => {
			return data.technologies?.includes(technologyRef);
		});

		// Sort by published date, most recent first
		const sortedVideos = allVideos.sort((a, b) =>
			new Date(b.data.publishedAt).getTime() - new Date(a.data.publishedAt).getTime()
		);

		// Map to the expected format
		return sortedVideos.map((video) => ({
			id: video.data.id,
			title: video.data.title,
			thumbnailUrl: `https://content.rawkode.academy/videos/${video.data.videoId}/thumbnail.jpg`,
			slug: video.data.slug,
		}));
	} catch (error) {
		console.warn(`Failed to fetch videos for technology ${technologyId}:`, error);
		return [];
	}
}
