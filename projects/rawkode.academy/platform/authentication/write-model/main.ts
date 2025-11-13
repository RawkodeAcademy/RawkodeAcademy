import { createAuth, type Env } from "./auth-config";
import { AuthRpcService } from "./rpc-service";

// Export the RPC service for service bindings
export { AuthRpcService };

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		
		// RPC endpoint for service-to-service communication
		if (url.pathname.startsWith("/rpc/")) {
			const rpcService = new AuthRpcService(env);
			const method = url.pathname.replace("/rpc/", "");
			
			try {
				const body = await request.json();
				
				switch (method) {
					case "verifySession":
						const verifyResult = await rpcService.verifySession(body.sessionToken);
						return Response.json(verifyResult);
					
					case "getUser":
						const user = await rpcService.getUser(body.userId);
						return Response.json(user);
					
					case "getUserByEmail":
						const userByEmail = await rpcService.getUserByEmail(body.email);
						return Response.json(userByEmail);
					
					case "listUserSessions":
						const sessions = await rpcService.listUserSessions(body.userId);
						return Response.json(sessions);
					
					case "revokeSession":
						const revoked = await rpcService.revokeSession(body.sessionId);
						return Response.json({ success: revoked });
					
					case "validatePasskey":
						const valid = await rpcService.validatePasskey(body.userId, body.credentialId);
						return Response.json({ valid });
					
					default:
						return Response.json({ error: "Unknown RPC method" }, { status: 404 });
				}
			} catch (error) {
				return Response.json(
					{ error: error instanceof Error ? error.message : "RPC error" },
					{ status: 500 }
				);
			}
		}
		
		// Regular Better Auth routes
		const auth = createAuth(env);
		
		// Better Auth handles all authentication routes:
		// - GET/POST /sign-in/github - GitHub OAuth
		// - GET /sign-in/github/callback - GitHub callback
		// - POST /sign-out - Sign out
		// - GET /session - Get current session
		// - POST /passkey/register - Register passkey
		// - POST /passkey/authenticate - Authenticate with passkey
		// - GET /passkey/list - List user's passkeys
		// - DELETE /passkey/:id - Delete a passkey
		
		return auth.handler(request);
	},
};

