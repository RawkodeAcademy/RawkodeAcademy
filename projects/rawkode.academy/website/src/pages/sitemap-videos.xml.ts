import type { APIRoute } from "astro";

export const prerender = true;

interface Video {
  slug: string;
  publishedAt: string;
}

async function fetchVideosFromGraphQL(): Promise<Video[]> {
  try {
    const response = await fetch("https://api.rawkode.academy/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query GetAllVideosForSitemap {
            getLatestVideos(limit: 1000) {
              slug
              publishedAt
            }
          }
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return [];
    }

    return data.data?.getLatestVideos || [];
  } catch (error) {
    console.error("Error fetching videos for sitemap:", error);
    return [];
  }
}

export const GET: APIRoute = async ({ site }) => {
  const videos = await fetchVideosFromGraphQL();
  
  const sitemapEntries = videos.map((video) => {
    const lastmod = new Date(video.publishedAt).toISOString();
    return `
    <url>
      <loc>${site}watch/${video.slug}/</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>`;
  }).join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
};