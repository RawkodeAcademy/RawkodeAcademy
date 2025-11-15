import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals, request }) => {
	const authService = locals.runtime?.env?.AUTH_SERVICE;
	const emojiReactionsService = locals.runtime?.env?.EMOJI_REACTIONS;

	const debugInfo = {
		timestamp: new Date().toISOString(),
		environment: import.meta.env.MODE,
		services: {
			authService: {
				available: !!authService,
				type: authService ? typeof authService : "undefined",
				hasFetch: authService
					? typeof authService.fetch === "function"
					: false,
			},
			emojiReactions: {
				available: !!emojiReactionsService,
				type: emojiReactionsService
					? typeof emojiReactionsService
					: "undefined",
				hasFetch: emojiReactionsService
					? typeof emojiReactionsService.fetch === "function"
					: false,
			},
		},
		runtime: {
			available: !!locals.runtime,
			hasEnv: !!locals.runtime?.env,
		},
		url: request.url,
	};

	// Try to make a test request to the auth service if available
	if (authService) {
		try {
			const testRequest = new Request("https://auth.internal/session", {
				method: "GET",
				headers: request.headers,
			});

			const response = await authService.fetch(testRequest);

			debugInfo.services.authService.testRequest = {
				status: response.status,
				statusText: response.statusText,
				ok: response.ok,
				headers: Object.fromEntries(response.headers.entries()),
			};

			// Only try to read body if it's JSON
			const contentType = response.headers.get("content-type");
			if (contentType?.includes("application/json")) {
				try {
					const body = await response.json();
					debugInfo.services.authService.testRequest.body = body;
				} catch {
					debugInfo.services.authService.testRequest.bodyError =
						"Failed to parse JSON response";
				}
			}
		} catch (error) {
			debugInfo.services.authService.testRequest = {
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	return new Response(JSON.stringify(debugInfo, null, 2), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-store, no-cache, must-revalidate",
		},
	});
};
