import { createAuth, type Env } from "./auth-config";

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const auth = createAuth(env);
		
		// Better Auth handles all authentication routes
		// This includes:
		// - POST /sign-up - Create new account
		// - POST /sign-in - Sign in with email/password
		// - POST /sign-out - Sign out
		// - POST /verify-email - Verify email with token
		// - POST /forgot-password - Request password reset
		// - POST /reset-password - Reset password with token
		// - GET /session - Get current session
		// - POST /refresh - Refresh session
		
		return auth.handler(request);
	},
};
