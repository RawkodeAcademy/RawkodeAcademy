import type { APIContext } from "astro";
import { getCollection, render } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";
import { getContainerRenderer as getMDXRenderer } from "@astrojs/mdx";
import sanitizeHtml from "sanitize-html";

interface AtomEntry {
	title: string;
	description: string;
	url: string;
	published: string;
	updated: string;
	categories: string[];
	author?: string;
	thumbnail?: string;
	duration?: number;
	type: "article" | "video";
	content?: string;
}

export async function GET(context: APIContext) {
	const [articles, videos] = await Promise.all([
		getCollection("articles", ({ data }) => !data.isDraft),
		getCollection("videos"),
	]);

	const site = context.site?.toString() || "https://rawkode.academy";
	const feedUrl = `${site}/api/feeds/all.atom`;

	// Setup Container API for rendering MDX
	const renderers = await loadRenderers([getMDXRenderer()]);
	const container = await AstroContainer.create({ renderers });

	const entries: AtomEntry[] = [];

	// Add articles with rendered content
	for (const article of articles) {
		let content: string | undefined;
		try {
			// Render the article to get the Content component
			const { Content } = await render(article);
			
			// Use the container to render the Content component to HTML string
			const renderedContent = await container.renderToString(Content);
			
			// Sanitize the HTML for safety
			content = sanitizeHtml(renderedContent, {
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
		}

		entries.push({
			title: article.data.title,
			description: article.data.description,
			url: `${site}/read/${article.id}/`,
			published: new Date(article.data.publishedAt).toISOString(),
			updated: article.data.updatedAt
				? new Date(article.data.updatedAt).toISOString()
				: new Date(article.data.publishedAt).toISOString(),
			categories: article.data.series ? [article.data.series.id] : [],
			author: article.data.authors.map((author) => author.id).join(", "),
			type: "article",
			...(content && { content }),
		});
	}

	// Add videos
	videos.forEach((video) => {
		entries.push({
			title: video.data.title,
			description: video.data.description,
			url: `${site}/watch/${video.data.slug}/`,
			published: new Date(video.data.publishedAt).toISOString(),
			updated: new Date(video.data.publishedAt).toISOString(),
			categories: video.data.technologies.map((tech) => tech.name),
			thumbnail: video.data.thumbnailUrl,
			duration: video.data.duration,
			type: "video",
		});
	});

	// Sort all entries by published date desc
	entries.sort(
		(a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
	);

	// Get the most recent update time
	const lastUpdated =
		entries.length > 0
			? entries[0]?.updated || new Date().toISOString()
			: new Date().toISOString();

	const atomFeed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
	<title>Rawkode Academy - All Content</title>
	<subtitle>Latest articles and videos from Rawkode Academy covering Cloud Native, DevOps, and Modern Software Development</subtitle>
	<link href="${feedUrl}" rel="self" type="application/atom+xml"/>
	<link href="${site}" rel="alternate" type="text/html"/>
	<id>${site}/</id>
	<updated>${lastUpdated}</updated>
	<generator>Astro</generator>
${entries
	.map((entry) => {
		const contentHtml =
			entry.type === "article" && entry.content
				? entry.content
				: entry.type === "video" && entry.thumbnail
				? `<img src="${entry.thumbnail}" alt="${entry.title}" /><p>${entry.description}</p><p>Duration: ${Math.floor(
						entry.duration! / 60,
					)}:${(entry.duration! % 60).toString().padStart(2, "0")}</p>`
				: entry.description;

		return `	<entry>
		<title><![CDATA[${entry.title}]]></title>
		<link href="${entry.url}" rel="alternate" type="text/html"/>
		${
			entry.thumbnail
				? `<link href="${entry.thumbnail}" rel="enclosure" type="image/jpeg"/>`
				: ""
		}
		<id>${entry.url}</id>
		<published>${entry.published}</published>
		<updated>${entry.updated}</updated>
		<summary><![CDATA[${entry.description}]]></summary>
		<content type="html"><![CDATA[${contentHtml}]]></content>
		${entry.author ? `<author><name>${entry.author}</name></author>` : ""}
		${entry.categories
			.map((cat) => `<category term="${cat}" label="${cat}"/>`)
			.join("\n\t\t")}
	</entry>`;
	})
	.join("\n")}
</feed>`;

	return new Response(atomFeed, {
		headers: {
			"Content-Type": "application/atom+xml; charset=utf-8",
			"Cache-Control": "max-age=3600",
		},
	});
}
