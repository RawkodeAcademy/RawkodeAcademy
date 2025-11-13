import { drizzle } from "drizzle-orm/d1";
import * as dataSchema from "../data-model/schema";
import type { D1Database } from "@cloudflare/workers-types";

export interface Env {
	DB: D1Database;
}

/**
 * RPC Service for Authentication
 * Implements Cap'n Proto interface for service-to-service communication
 */
export class AuthRpcService {
	private db;

	constructor(env: Env) {
		this.db = drizzle(env.DB, { schema: dataSchema });
	}

	/**
	 * Verify a session and return user info
	 */
	async verifySession(sessionToken: string) {
		try {
			const session = await this.db.query.session.findFirst({
				where: (sessions, { eq }) => eq(sessions.id, sessionToken),
				with: {
					user: true,
				},
			});

			if (!session) {
				return {
					success: false,
					error: "Session not found",
				};
			}

			// Check if session is expired
			if (session.expiresAt < new Date()) {
				return {
					success: false,
					error: "Session expired",
				};
			}

			return {
				success: true,
				user: session.user,
				session: {
					id: session.id,
					userId: session.userId,
					expiresAt: session.expiresAt,
					ipAddress: session.ipAddress,
					userAgent: session.userAgent,
				},
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Get user by ID
	 */
	async getUser(userId: string) {
		return await this.db.query.user.findFirst({
			where: (users, { eq }) => eq(users.id, userId),
		});
	}

	/**
	 * Get user by email
	 */
	async getUserByEmail(email: string) {
		return await this.db.query.user.findFirst({
			where: (users, { eq }) => eq(users.email, email),
		});
	}

	/**
	 * List all sessions for a user
	 */
	async listUserSessions(userId: string) {
		return await this.db.query.session.findMany({
			where: (sessions, { eq }) => eq(sessions.userId, userId),
		});
	}

	/**
	 * Revoke a session
	 */
	async revokeSession(sessionId: string) {
		try {
			await this.db.delete(dataSchema.session).where(
				(session) => session.id === sessionId,
			);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Validate if a passkey credential belongs to a user
	 */
	async validatePasskey(userId: string, credentialId: string) {
		const passkey = await this.db.query.passkey.findFirst({
			where: (passkeys, { and, eq }) => 
				and(
					eq(passkeys.userId, userId),
					eq(passkeys.id, credentialId)
				),
		});
		return !!passkey;
	}
}
