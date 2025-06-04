import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";
import { getContainerRenderer as getMDXRenderer } from "@astrojs/mdx";
import { render } from "astro:content";
import sanitizeHtml from "sanitize-html";
import type { CollectionEntry } from "astro:content";

interface RenderResult {
	content?: string;
	error?: string;
}

/**
 * Setup the Astro Container API for rendering MDX content
 */
export async function createMDXContainer() {
	const renderers = await loadRenderers([getMDXRenderer()]);
	return await AstroContainer.create({ renderers });
}

/**
 * Render and sanitize a single article's MDX content to HTML
 */
export async function renderAndSanitizeArticle(
	article: CollectionEntry<"articles">,
	container: Awaited<ReturnType<typeof createMDXContainer>>
): Promise<RenderResult> {
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
		
		return { content };
	} catch (error) {
		console.error(`Failed to render content for article ${article.id}:`, error);
		return { error: `Failed to render: ${error}` };
	}
}

/**
 * Render and sanitize multiple articles in parallel for better performance
 */
export async function renderAndSanitizeArticles(
	articles: CollectionEntry<"articles">[]
): Promise<Map<string, RenderResult>> {
	const container = await createMDXContainer();
	
	// Process all articles in parallel for better performance
	const renderPromises = articles.map(async (article) => ({
		id: article.id,
		result: await renderAndSanitizeArticle(article, container)
	}));
	
	const results = await Promise.all(renderPromises);
	
	// Convert to Map for easy lookup
	return new Map(results.map(({ id, result }) => [id, result]));
}