import type { ExportedHandler } from "@cloudflare/workers-types";
import { createGatewayRuntime } from "@graphql-hive/gateway-runtime";
import httpTransport from "@graphql-mesh/transport-http";
import { supergraphSdl } from "./generated/supergraph";

interface Env {
	SUPERGRAPH_SHA?: string;
}

let runtime: ReturnType<typeof createGatewayRuntime> | undefined;

const ensureRuntime = (env: Env) => {
	if (!supergraphSdl.trim()) {
		throw new Error("Supergraph SDL missing. Run `bun run supergraph:build` before starting the gateway.");
	}

	if (!runtime) {
		runtime = createGatewayRuntime({
			supergraph: supergraphSdl,
			transports: {
				http: httpTransport,
			},
			maskedErrors: true,
			logging: {
				level: "info",
				custom: {
					onServerStart: () => {
						console.log("GraphQL gateway ready");
					},
				},
			},
			propagateHeaders: {
				fromClientToSubgraphs: ({ request }) => {
					const headers: Record<string, string> = {};
					const auth = request.headers.get("authorization");
					if (auth) {
						headers["authorization"] = auth;
					}
					const cfAccess = request.headers.get("cf-access-jwt-assertion");
					if (cfAccess) {
						headers["cf-access-jwt-assertion"] = cfAccess;
					}
					return headers;
				},
			},
		});
	}

	return runtime;
};

export default {
	async fetch(request, env, ctx) {
		const gateway = ensureRuntime(env);
		const response = (await gateway(request, env, ctx)) as Response;
		response.headers.set("x-supergraph-sha", env.SUPERGRAPH_SHA ?? "local");
		return response;
	},
} satisfies ExportedHandler<Env>;
