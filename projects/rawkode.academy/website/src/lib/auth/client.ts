/**
 * Authentication Service Client
 * Uses Cloudflare Service Binding for RPC communication
 */

export interface User {
	id: string;
	email: string;
	name: string | null;
	image: string | null;
	emailVerified: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface Session {
	id: string;
	userId: string;
	expiresAt: Date;
	ipAddress: string | null;
	userAgent: string | null;
}

export interface AuthResponse {
	success: boolean;
	user?: User;
	session?: Session;
	error?: string;
}

export interface AuthServiceBinding {
	fetch(request: Request): Promise<Response>;
}

export class AuthClient {
	private service: AuthServiceBinding;

	constructor(service: AuthServiceBinding) {
		this.service = service;
	}

	/**
	 * Verify a session token and return user info
	 */
	async verifySession(sessionToken: string): Promise<AuthResponse> {
		const response = await this.service.fetch(
			new Request("http://auth-service/rpc/verifySession", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sessionToken }),
			})
		);
		return await response.json();
	}

	/**
	 * Get user by ID
	 */
	async getUser(userId: string): Promise<User | null> {
		const response = await this.service.fetch(
			new Request("http://auth-service/rpc/getUser", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId }),
			})
		);
		return await response.json();
	}

	/**
	 * Get user by email
	 */
	async getUserByEmail(email: string): Promise<User | null> {
		const response = await this.service.fetch(
			new Request("http://auth-service/rpc/getUserByEmail", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			})
		);
		return await response.json();
	}

	/**
	 * List sessions for a user
	 */
	async listUserSessions(userId: string): Promise<Session[]> {
		const response = await this.service.fetch(
			new Request("http://auth-service/rpc/listUserSessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId }),
			})
		);
		return await response.json();
	}

	/**
	 * Revoke a session
	 */
	async revokeSession(sessionId: string): Promise<boolean> {
		const response = await this.service.fetch(
			new Request("http://auth-service/rpc/revokeSession", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sessionId }),
			})
		);
		const result = await response.json();
		return result.success;
	}

	/**
	 * Validate passkey credential
	 */
	async validatePasskey(userId: string, credentialId: string): Promise<boolean> {
		const response = await this.service.fetch(
			new Request("http://auth-service/rpc/validatePasskey", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId, credentialId }),
			})
		);
		const result = await response.json();
		return result.valid;
	}
}
