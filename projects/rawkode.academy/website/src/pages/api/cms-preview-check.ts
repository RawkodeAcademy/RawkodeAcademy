import type { APIRoute } from "astro";
import { getCollection, getPayloadHomepagePages, getPayloadRequestState } from "@/lib/payload-content";

export const prerender = false;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export const GET: APIRoute = async ({ request }) => {
	const env = getPayloadRequestState()?.env;
	if (!env?.PAYLOAD_PREVIEW_PR) {
		return new Response(null, {
			status: 404,
			headers: { "Cache-Control": "no-store" },
		});
	}

	try {
		if (!env.PAYLOAD_PREVIEW_SHA || !env.PAYLOAD_CONTENT) {
			throw new Error("The isolated Payload preview binding is unavailable.");
		}
		const [video] = await getCollection("videos", undefined, { limit: 1 });
		if (!video) {
			return new Response(JSON.stringify({
				error: "No public video is available.",
				diagnostic: "The source has no publicly visible video in the seeded baseline.",
			}), {
				status: 503,
				headers: {
					"Content-Type": "application/json; charset=utf-8",
					"Cache-Control": "no-store",
				},
			});
		}
		// Probe the raw bridge projection, before the website maps its fields.
		// Only the dedicated demo endpoint may return inline files/import paths.
		for (const view of ["summary", "full"]) {
			const projectionUrl = new URL("https://payload.internal/v1/collections/course-modules");
			projectionUrl.searchParams.set("slug", "complete-guide-zitadel/01-introduction");
			projectionUrl.searchParams.set("view", view);
			const projectionResponse = await env.PAYLOAD_CONTENT.fetch(new Request(projectionUrl));
			const projection: unknown = await projectionResponse.json();
			if (!projectionResponse.ok || !isRecord(projection) || !isRecord(projection.doc) || projection.doc.slug !== "complete-guide-zitadel/01-introduction") {
				throw new Error("The ordinary module projection is missing its source fixture.");
			}
			const forbidden = new Set(["files", "import", "localDir", "sourcePath", "sourceAssets"]);
			const inspect = (value: unknown): void => {
				if (Array.isArray(value)) { value.forEach(inspect); return; }
				if (!isRecord(value)) return;
				for (const [key, child] of Object.entries(value)) {
					if (forbidden.has(key)) throw new Error(`Ordinary content exposed private demo field: ${key}`);
					inspect(child);
				}
			};
			inspect(projection.doc);
			if (view === "full" && (!Array.isArray(projection.doc.contentResources) || !projection.doc.contentResources.some(resource => isRecord(resource) && isRecord(resource.embedConfig) && resource.embedConfig.container === "webcontainer"))) {
				throw new Error("The full module projection is missing its sanitized demo metadata.");
			}
		}

		if (new URL(request.url).searchParams.get("homepage") === "1") {
			const homepage = await getPayloadHomepagePages(8);
			return new Response(JSON.stringify({
				homepage: {
					videos: homepage.videoPage.totalDocs,
					articles: homepage.articlePage.totalDocs,
					news: homepage.newsPage.totalDocs,
					courses: homepage.coursePage.totalDocs,
					learningPaths: homepage.learningPathPage.totalDocs,
				},
				readOnly: true,
			}), {
				headers: {
					"Content-Type": "application/json; charset=utf-8",
					"Cache-Control": "no-store",
				},
			});
		}

		return new Response(
			JSON.stringify({
				video: { id: video.id, slug: video.slug, title: video.data.title },
				demoProjectionPrivate: true,
				readOnly: true,
				contentSource: {
					worker: env.PAYLOAD_PREVIEW_SOURCE_WORKER,
					sha: env.PAYLOAD_PREVIEW_SOURCE_SHA,
				},
			}),
			{
				headers: {
					"Content-Type": "application/json; charset=utf-8",
					"Cache-Control": "no-store",
				},
			},
		);
	} catch (error) {
		const diagnostic = error instanceof Error ? error.message : String(error);
		return new Response(JSON.stringify({
			error: "Payload bridge is unavailable.",
			diagnostic: diagnostic.slice(0, 240),
		}), {
			status: 503,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "no-store",
			},
		});
	}
};
