interface Video {
	slug: string;
	publishedAt: string;
}

export async function fetchVideosFromGraphQL(): Promise<Video[]> {
	try {
		// This function is called during build time in astro.config.mts,
		// so we can't use astro:env/server here
		const graphqlEndpoint =
			process.env.GRAPHQL_ENDPOINT || "https://api.rawkode.academy/graphql";
		
		const allVideos: Video[] = [];
		const batchSize = 32; // Use smaller batches to avoid SQL variable limits
		let offset = 0;
		let hasMoreVideos = true;

		while (hasMoreVideos) {
			const response = await fetch(graphqlEndpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					query: `
						query GetVideosForSitemap($limit: Int!, $offset: Int!) {
							getLatestVideos(limit: $limit, offset: $offset) {
								slug
								publishedAt
							}
						}
					`,
					variables: { limit: batchSize, offset }
				}),
			});

			if (!response.ok) {
				throw new Error(`GraphQL request failed: ${response.status}`);
			}

			const data: {
				data?: { getLatestVideos?: Video[] };
				errors?: any;
			} = await response.json();

			if (data.errors) {
				console.error("GraphQL errors:", data.errors);
				break;
			}

			const batchVideos = data.data?.getLatestVideos || [];
			
			if (batchVideos.length === 0) {
				hasMoreVideos = false;
			} else {
				allVideos.push(...batchVideos);
				offset += batchSize;
				
				// Safety check to prevent infinite loops
				if (offset > 1000) {
					console.warn('Reached maximum offset limit of 1000 videos');
					break;
				}
			}
		}

		return allVideos;
	} catch (error) {
		console.error("Error fetching videos for sitemap:", error);
		return [];
	}
}
