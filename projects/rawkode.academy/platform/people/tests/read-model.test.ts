import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { join } from "node:path";
import { graphql } from "graphql";
import { peopleSeed, toSql } from "../../../../../content/scripts/platform-seed";
import { getSchema } from "../read-model/schema";
import { migratedD1, seed } from "./d1";

let db: Awaited<ReturnType<typeof migratedD1>>;
const query = async (source: string, headers: Record<string, string> = {}) => {
	const result = await graphql({
		schema: getSchema({ DB: db.DB }),
		source,
		contextValue: { request: new Request("https://people.internal/", { headers }) },
	});
	if (result.errors) throw result.errors[0];
	return result.data as Record<string, any>;
};

beforeAll(async () => {
	db = await migratedD1(join(import.meta.dir, ".."));
	await seed(db.DB, toSql(await peopleSeed()));
});
afterAll(() => db.dispose());

describe("people read model", () => {
	it("imports every person in content/people", async () => {
		const { allPeople } = await query("{ allPeople { id } }");
		expect(allPeople).toHaveLength((await peopleSeed()).rows.length);
	});

	it("serves a person the way the website subgraph did", async () => {
		const { personById } = await query(`{ personById(id: "salaboy") {
			id name forename surname githubHandle githubUrl avatarUrl
			twitterUrl blueskyUrl linkedinUrl websiteUrl } }`);
		expect(personById).toEqual({
			id: "salaboy",
			name: "Mauricio Salatino",
			forename: "Mauricio",
			surname: "Salatino",
			githubHandle: "salaboy",
			githubUrl: "https://github.com/salaboy",
			avatarUrl: "https://avatars.githubusercontent.com/salaboy",
			twitterUrl: "https://x.com/salaboy",
			blueskyUrl: "https://bsky.app/profile/salaboy.com",
			linkedinUrl: "https://www.linkedin.com/in/salaboy",
			websiteUrl: "https://www.salaboy.com/",
		});
	});

	it("matches GitHub usernames by id first, then by handle", async () => {
		const { personByGithub } = await query(`{ personByGithub(username: "SalaBoy") { id } }`);
		expect(personByGithub).toEqual({ id: "salaboy" });
		const { nobody } = await query(`{ nobody: personByGithub(username: "   ") { id } }`);
		expect(nobody).toBeNull();
	});

	it("resolves me from the gateway's username header", async () => {
		expect((await query("{ me { id } }", { "X-Gateway-User-Username": "salaboy" })).me).toEqual({ id: "salaboy" });
		expect((await query("{ me { id } }")).me).toBeNull();
	});

	it("resolves Person entities for the gateway", async () => {
		const { _entities } = await query(`{ _entities(representations: [{ __typename: "Person", id: "salaboy" }]) { ... on Person { name } } }`);
		expect(_entities).toEqual([{ name: "Mauricio Salatino" }]);
	});
});

describe("people migrations", () => {
	it("upgrade a database created by the original service", async () => {
		const old = await migratedD1(join(import.meta.dir, ".."), "0000_shiny_korvac.sql");
		await old.DB.prepare("INSERT INTO people (id, forename, surname) VALUES ('legacy', 'Old', 'Row')").run();
		const { exec } = await import("./d1");
		const { readFile } = await import("node:fs/promises");
		await exec(old.DB, await readFile(join(import.meta.dir, "../data-model/migrations/0001_content_fields.sql"), "utf8"));
		await seed(old.DB, toSql(await peopleSeed()));
		const legacy = await old.DB.prepare("SELECT count(*) AS n FROM people WHERE id = 'legacy'").first<{ n: number }>();
		expect(legacy?.n).toBe(0);
		await old.dispose();
	});
});
