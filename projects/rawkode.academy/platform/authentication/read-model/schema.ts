import { createPothosBuilder } from "./builder";
import { usersTable } from "../data-model/schema";

export const buildSchema = () => {
	const builder = createPothosBuilder();

	// User type
	const UserRef = builder.drizzleObject("User", {
		fields: (t) => ({
			id: t.exposeString("id"),
			email: t.exposeString("email"),
			emailVerified: t.exposeBoolean("emailVerified"),
			name: t.string({
				nullable: true,
				resolve: (user) => user.name,
			}),
			image: t.string({
				nullable: true,
				resolve: (user) => user.image,
			}),
			createdAt: t.field({
				type: "DateTime",
				resolve: (user) => user.createdAt,
			}),
			updatedAt: t.field({
				type: "DateTime",
				resolve: (user) => user.updatedAt,
			}),
		}),
	});

	// Add DateTime scalar
	builder.scalarType("DateTime", {
		serialize: (value) => (value instanceof Date ? value.toISOString() : value),
		parseValue: (value) => {
			if (typeof value === "string") {
				return new Date(value);
			}
			if (typeof value === "number") {
				return new Date(value);
			}
			throw new Error("Invalid DateTime value");
		},
	});

	// Query type
	builder.queryType({
		fields: (t) => ({
			user: t.field({
				type: UserRef,
				nullable: true,
				args: {
					id: t.arg.string({ required: false }),
					email: t.arg.string({ required: false }),
				},
				resolve: async (_root, args, ctx) => {
					if (args.id) {
						return await ctx.db.query.usersTable.findFirst({
							where: (users, { eq }) => eq(users.id, args.id!),
						});
					}
					if (args.email) {
						return await ctx.db.query.usersTable.findFirst({
							where: (users, { eq }) => eq(users.email, args.email!),
						});
					}
					return null;
				},
			}),
			users: t.field({
				type: [UserRef],
				args: {
					limit: t.arg.int({ required: false }),
					offset: t.arg.int({ required: false }),
				},
				resolve: async (_root, args, ctx) => {
					return await ctx.db.query.usersTable.findMany({
						limit: args.limit ?? 15,
						offset: args.offset ?? 0,
					});
				},
			}),
		}),
	});

	return builder.toSchema();
};
