import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
	accountsTable,
	sessionsTable,
	usersTable,
	verificationTokensTable,
} from "../schema";

// User schemas
export const SelectUser = createSelectSchema(usersTable);
export const CreateUser = createInsertSchema(usersTable, {
	email: z.string().email(),
	name: z.string().min(1).optional(),
	image: z.string().url().optional(),
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const UpdateUser = CreateUser.partial();

// Session schemas
export const SelectSession = createSelectSchema(sessionsTable);
export const CreateSession = createInsertSchema(sessionsTable).omit({
	id: true,
	createdAt: true,
});

// Account schemas
export const SelectAccount = createSelectSchema(accountsTable);
export const CreateAccount = createInsertSchema(accountsTable, {
	provider: z.enum(["email", "google", "github", "oauth"]),
	passwordHash: z.string().optional(),
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

// Verification token schemas
export const SelectVerificationToken = createSelectSchema(
	verificationTokensTable,
);
export const CreateVerificationToken = createInsertSchema(
	verificationTokensTable,
	{
		type: z.enum(["email_verification", "password_reset"]),
		identifier: z.string().email(),
		token: z.string().min(32),
	},
).omit({
	createdAt: true,
});

// Authentication request schemas
export const SignUpSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	name: z.string().min(1).optional(),
});

export const SignInSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

export const PasswordResetRequestSchema = z.object({
	email: z.string().email(),
});

export const PasswordResetSchema = z.object({
	token: z.string(),
	password: z.string().min(8),
});

export const EmailVerificationSchema = z.object({
	token: z.string(),
});
