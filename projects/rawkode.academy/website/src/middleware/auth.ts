import { defineMiddleware } from "astro:middleware";
import { createBetterAuthClient } from "@/lib/auth/better-auth-client.ts";

export const authMiddleware = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;
	if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-out")) {
		console.log(`[AUTH] Intercepting: ${pathname}`);

		const authService = context.locals.runtime?.env?.AUTH_SERVICE;
		if (!authService) {
			console.error("[AUTH] AUTH_SERVICE not available");
			return new Response(
				JSON.stringify({
					error: "Authentication service not configured",
					message: "Please ensure AUTH_SERVICE binding is configured in wrangler.jsonc",
					hint: "In local development, you may need to run the authentication service or use a deployed instance"
				}),
				{
					status: 503,
					headers: { "Content-Type": "application/json" }
				}
			);
		}

		console.log("[AUTH] AUTH_SERVICE available, proxying request");

		try {
			// Create a new Request with the proper URL for the service binding
			const proxyUrl = new URL(context.url.pathname + context.url.search, "https://auth.internal");
			console.log(`[AUTH] Proxy URL: ${proxyUrl.toString()}`);

			const proxyRequest = new Request(proxyUrl.toString(), {
				method: context.request.method,
				headers: context.request.headers,
				body: context.request.method !== "GET" && context.request.method !== "HEAD"
					? context.request.body
					: undefined,
			});

			const response = await authService.fetch(proxyRequest);
			console.log(`[AUTH] Response status: ${response.status}`);

			return response;
		} catch (error) {
			console.error("[AUTH] Failed to proxy auth request:", error);
			return new Response(
				JSON.stringify({
					error: "Authentication service unavailable",
					message: error instanceof Error ? error.message : String(error),
					hint: "Remote service bindings may not be available in local development"
				}),
				{
					status: 503,
					headers: { "Content-Type": "application/json" }
				}
			);
		}
	}

	if (context.isPrerendered) {
		// The runtime isn't available for pre-rendered pages and we
		// only want this middleware to run for SSR.
		console.debug("Prerendered: skipping auth middleware");
		return next();
	}

	try {
		// Access the AUTH_SERVICE binding from the runtime environment
		const authService = context.locals.runtime?.env?.AUTH_SERVICE;

		if (!authService) {
			console.warn(
				"AUTH_SERVICE binding not available in runtime environment. Continuing without authentication.",
			);
			return next();
		}

		// Create Better Auth client with header forwarding
		const authClient = createBetterAuthClient(authService, {
			getHeaders: () => context.request.headers,
		});

		// Verify the session
		const { data, error } = await authClient.getSession();

		if (error) {
			console.debug("Session verification error:", error);
			return next();
		}

		if (data?.user) {
			// Set authenticated user in context
			const authenticatedUser = {
				...data.user,
				image: data.user.image ?? null,
				// Temporary shim: expose Better Auth user ID via legacy `sub` field until consumers migrate.
				sub: data.user.id,
			};
			context.locals.user = authenticatedUser;
		}

		return next();
	} catch (error) {
		// Log error but don't block the request
		console.error("Auth middleware error:", error);
		return next();
	}
});
