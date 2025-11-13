import { newServiceBindingRpcSession, type RpcPromise } from "capnweb";
import type { AuthRpcService } from "../../../platform/authentication/rpc/rpc-service";

/**
 * Authentication Service Client using capnweb
 * Uses Cloudflare Service Binding for efficient RPC communication
 */

export interface AuthServiceBinding {
	fetch(request: Request): Promise<Response>;
}

/**
 * Create an authentication client from a service binding
 */
export function createAuthClient(
	service: AuthServiceBinding,
): RpcPromise<AuthRpcService> {
	return newServiceBindingRpcSession<AuthRpcService>(service);
}

/**
 * Helper class for backward compatibility
 * @deprecated Use createAuthClient() directly with the service binding
 */
export class AuthClient {
	private rpcSession: RpcPromise<AuthRpcService>;

	constructor(service: AuthServiceBinding) {
		this.rpcSession = newServiceBindingRpcSession<AuthRpcService>(service);
	}

	/**
	 * Verify a session token and return user info
	 */
	async verifySession(sessionToken: string) {
		return await this.rpcSession.verifySession(sessionToken);
	}

	/**
	 * Get user by ID
	 */
	async getUser(userId: string) {
		return await this.rpcSession.getUser(userId);
	}

	/**
	 * Get user by email
	 */
	async getUserByEmail(email: string) {
		return await this.rpcSession.getUserByEmail(email);
	}

	/**
	 * List sessions for a user
	 */
	async listUserSessions(userId: string) {
		return await this.rpcSession.listUserSessions(userId);
	}

	/**
	 * Revoke a session
	 */
	async revokeSession(sessionId: string) {
		return await this.rpcSession.revokeSession(sessionId);
	}

	/**
	 * Validate passkey credential
	 */
	async validatePasskey(userId: string, credentialId: string) {
		return await this.rpcSession.validatePasskey(userId, credentialId);
	}
}
