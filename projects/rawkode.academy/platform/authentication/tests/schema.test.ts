import { describe, expect, test } from "bun:test";
import { usersTable, sessionsTable, accountsTable, verificationTokensTable } from "../data-model/schema";

describe("Authentication Schema", () => {
	test("usersTable has required columns", () => {
		expect(usersTable).toBeDefined();
		expect(usersTable.id).toBeDefined();
		expect(usersTable.email).toBeDefined();
		expect(usersTable.emailVerified).toBeDefined();
		expect(usersTable.name).toBeDefined();
		expect(usersTable.image).toBeDefined();
		expect(usersTable.createdAt).toBeDefined();
		expect(usersTable.updatedAt).toBeDefined();
	});

	test("sessionsTable has required columns", () => {
		expect(sessionsTable).toBeDefined();
		expect(sessionsTable.id).toBeDefined();
		expect(sessionsTable.userId).toBeDefined();
		expect(sessionsTable.expiresAt).toBeDefined();
		expect(sessionsTable.createdAt).toBeDefined();
	});

	test("accountsTable has required columns", () => {
		expect(accountsTable).toBeDefined();
		expect(accountsTable.id).toBeDefined();
		expect(accountsTable.userId).toBeDefined();
		expect(accountsTable.provider).toBeDefined();
		expect(accountsTable.providerAccountId).toBeDefined();
		expect(accountsTable.passwordHash).toBeDefined();
	});

	test("verificationTokensTable has required columns", () => {
		expect(verificationTokensTable).toBeDefined();
		expect(verificationTokensTable.identifier).toBeDefined();
		expect(verificationTokensTable.token).toBeDefined();
		expect(verificationTokensTable.expiresAt).toBeDefined();
		expect(verificationTokensTable.type).toBeDefined();
	});
});
