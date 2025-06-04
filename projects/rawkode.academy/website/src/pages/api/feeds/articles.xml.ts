import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection, render } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";
import { getContainerRenderer as getMDXRenderer } from "@astrojs/mdx";
import sanitizeHtml from "sanitize-html";

export async function GET(context: APIContext) {
	const articles = await getCollection("articles", ({ data }) => !data.isDraft);

	// Sort by publishedAt desc
	const sortedArticles = articles.sort(
		(a, b) =>
			new Date(b.data.publishedAt).getTime() -
			new Date(a.data.publishedAt).getTime(),
	);

	// Setup Container API for rendering MDX
	const renderers = await loadRenderers([getMDXRenderer()]);
	const container = await AstroContainer.create({ renderers });

	// Process each article to include full content
	const items = [];
	for (const article of sortedArticles) {
		try {
			// Render the article to get the Content component
			const { Content } = await render(article);
			
			// Use the container to render the Content component to HTML string
			const renderedContent = await container.renderToString(Content);
			
			// Sanitize the HTML for safety
			const content = sanitizeHtml(renderedContent, {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'video', 'audio']),
				allowedAttributes: {
					...sanitizeHtml.defaults.allowedAttributes,
					img: ['src', 'alt', 'width', 'height', 'loading'],
					video: ['src', 'controls', 'width', 'height'],
					audio: ['src', 'controls']
				},
				allowedSchemes: ['http', 'https', 'data']
			});

			items.push({
				title: article.data.title,
				description: article.data.description,
				pubDate: new Date(article.data.publishedAt),
				link: `/read/${article.id}/`,
				author: article.data.authors.map((author) => author.id).join(", "),
				categories: article.data.series ? [article.data.series.id] : [],
				content // Full HTML content
			});
		} catch (error) {
			// If rendering fails, fallback to just description
			console.error(`Failed to render content for article ${article.id}:`, error);
			items.push({
				title: article.data.title,
				description: article.data.description,
				pubDate: new Date(article.data.publishedAt),
				link: `/read/${article.id}/`,
				author: article.data.authors.map((author) => author.id).join(", "),
				categories: article.data.series ? [article.data.series.id] : [],
			});
		}
	}

	return rss({
		title: "Rawkode Academy - Articles",
		description:
			"Latest articles and tutorials from Rawkode Academy covering Cloud Native, DevOps, and Modern Software Development",
		site: context.site?.toString() || "https://rawkode.academy",
		items,
		customData: `<language>en-us</language>`,
		stylesheet: false,
	});
}
