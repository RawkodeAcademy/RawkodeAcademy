import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { graphql } from "graphql";
import { showsSeed, toSql } from "../../../../../content/scripts/platform-seed";
import { getSchema } from "../read-model/schema";
import { exec, migratedD1, seed } from "./d1";

let db: Awaited<ReturnType<typeof migratedD1>>;
const query = async (source: string) => {
	const result = await graphql({ schema: getSchema({ DB: db.DB }), source, contextValue: {} });
	if (result.errors) throw result.errors[0];
	return result.data as Record<string, any>;
};

beforeAll(async () => {
	db = await migratedD1(join(import.meta.dir, ".."));
	await seed(db.DB, toSql(await showsSeed()));
});
afterAll(() => db.dispose());

describe("shows read model", () => {
	it("imports every show", async () => {
		const { allShows } = await query("{ allShows { id } }");
		expect(allShows.map((s: { id: string }) => s.id)).toEqual((await showsSeed()).rows.map((r) => String(r.id)).sort());
	});

	it("serves a show with its status and publish flag", async () => {
		const { showById } = await query(`{ showById(id: "klustered") { id name description status published } }`);
		expect(showById).toMatchObject({ id: "klustered", name: "Klustered", status: "active", published: true });
		expect(showById.description).toContain("live gameshow");
	});

	it("maps coming-soon to a GraphQL enum value", async () => {
		await db.DB.prepare("UPDATE shows SET status = 'coming-soon' WHERE id = 'spinlock'").run();
		const { showById } = await query(`{ showById(id: "spinlock") { status } }`);
		expect(showById.status).toBe("coming_soon");
	});

	it("resolves Show entities for the gateway", async () => {
		const { _entities } = await query(`{ _entities(representations: [{ __typename: "Show", id: "klustered" }]) { ... on Show { name } } }`);
		expect(_entities).toEqual([{ name: "Klustered" }]);
	});
});

describe("shows migrations", () => {
	it("upgrade a database created by the original service", async () => {
		const old = await migratedD1(join(import.meta.dir, ".."), "0000_kind_hedge_knight.sql");
		await old.DB.prepare("INSERT INTO shows (id, name) VALUES ('klustered', 'Old name')").run();
		await exec(old.DB, await readFile(join(import.meta.dir, "../data-model/migrations/0001_content_fields.sql"), "utf8"));
		await seed(old.DB, toSql(await showsSeed()));
		expect((await old.DB.prepare("SELECT name, published FROM shows WHERE id = 'klustered'").first())).toEqual({ name: "Klustered", published: 1 });
		await old.dispose();
	});
});
