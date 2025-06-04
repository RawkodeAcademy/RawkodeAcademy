import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { renderAndSanitizeArticles } from "../../../lib/feed-utils.js";

export async function GET(context: APIContext) {
	const articles = await getCollection("articles", ({ data }) => !data.isDraft);

	// Sort by publishedAt desc
	const sortedArticles = articles.sort(
		(a, b) =>
			new Date(b.data.publishedAt).getTime() -
			new Date(a.data.publishedAt).getTime(),
	);

	// Render all articles in parallel for better performance
	const renderedContent = await renderAndSanitizeArticles(sortedArticles);

	// Process each article to include full content
	const items = sortedArticles.map((article) => {
		const renderResult = renderedContent.get(article.id);
		
		return {
			title: article.data.title,
			description: article.data.description,
			pubDate: new Date(article.data.publishedAt),
			link: `/read/${article.id}/`,
			author: article.data.authors.map((author) => author.id).join(", "),
			categories: article.data.series ? [article.data.series.id] : [],
			...(renderResult?.content && { content: renderResult.content })
		};
	});

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
