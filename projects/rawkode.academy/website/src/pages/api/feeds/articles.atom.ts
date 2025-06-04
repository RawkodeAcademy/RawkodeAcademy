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

	const site = context.site?.toString() || "https://rawkode.academy";
	const feedUrl = `${site}/api/feeds/articles.atom`;

	// Get the most recent update time
	const lastUpdated =
		sortedArticles.length > 0
			? new Date(
					sortedArticles[0]?.data.updatedAt ||
						sortedArticles[0]?.data.publishedAt ||
						new Date(),
				).toISOString()
			: new Date().toISOString();

	// Setup Container API for rendering MDX
	const renderers = await loadRenderers([getMDXRenderer()]);
	const container = await AstroContainer.create({ renderers });

	// Process each article to include full content
	const entries = [];
	for (const article of sortedArticles) {
		const articleUrl = `${site}/read/${article.id}/`;
		const published = new Date(article.data.publishedAt).toISOString();
		const updated = article.data.updatedAt
			? new Date(article.data.updatedAt).toISOString()
			: published;

		let contentHtml = "";
		try {
			// Render the article to get the Content component
			const { Content } = await render(article);
			
			// Use the container to render the Content component to HTML string
			const renderedContent = await container.renderToString(Content);
			
			// Sanitize the HTML for safety
			contentHtml = sanitizeHtml(renderedContent, {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'video', 'audio']),
				allowedAttributes: {
					...sanitizeHtml.defaults.allowedAttributes,
					img: ['src', 'alt', 'width', 'height', 'loading'],
					video: ['src', 'controls', 'width', 'height'],
					audio: ['src', 'controls']
				},
				allowedSchemes: ['http', 'https', 'data']
			});
		} catch (error) {
			console.error(`Failed to render content for article ${article.id}:`, error);
			// Fallback to description if rendering fails
			contentHtml = article.data.description;
		}

		entries.push(`	<entry>
		<title><![CDATA[${article.data.title}]]></title>
		<link href="${articleUrl}" rel="alternate" type="text/html"/>
		<id>${articleUrl}</id>
		<published>${published}</published>
		<updated>${updated}</updated>
		<summary><![CDATA[${article.data.description}]]></summary>
		<content type="html"><![CDATA[${contentHtml}]]></content>
		${article.data.authors
			.map((author) => `<author><name>${author.id}</name></author>`)
			.join("\n\t\t")}
		${
			article.data.series
				? `<category term="${article.data.series.id}" label="${article.data.series.id}"/>`
				: ""
		}
	</entry>`);
	}

	const atomFeed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
	<title>Rawkode Academy - Articles</title>
	<subtitle>Latest articles and tutorials from Rawkode Academy covering Cloud Native, DevOps, and Modern Software Development</subtitle>
	<link href="${feedUrl}" rel="self" type="application/atom+xml"/>
	<link href="${site}" rel="alternate" type="text/html"/>
	<id>${site}/</id>
	<updated>${lastUpdated}</updated>
	<generator>Astro</generator>
${entries.join("\n")}
</feed>`;

	return new Response(atomFeed, {
		headers: {
			"Content-Type": "application/atom+xml; charset=utf-8",
			"Cache-Control": "max-age=3600",
		},
	});
}
