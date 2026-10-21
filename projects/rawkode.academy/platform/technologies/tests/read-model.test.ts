import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { graphql } from "graphql";
import { getSchema } from "../read-model/schema";
import { exec, migratedD1, loadFixtures } from "./d1";

let db: Awaited<ReturnType<typeof migratedD1>>;
const query = async (source: string) => {
	const result = await graphql({ schema: getSchema({ DB: db.DB }), source, contextValue: {} });
	if (result.errors) throw result.errors[0];
	return result.data as Record<string, any>;
};

beforeAll(async () => {
	db = await migratedD1(join(import.meta.dir, ".."));
	await loadFixtures(db.DB);
});
afterAll(() => db.dispose());

describe("technologies read model", () => {
	it("lists every technology, sorted by id", async () => {
		const { getTechnologies } = await query("{ getTechnologies(limit: 1000) { id } }");
		expect(getTechnologies).toHaveLength(21);
		const ids = getTechnologies.map((t: { id: string }) => t.id);
		expect(ids).toEqual([...ids].sort());
	});

	it("pages like the website subgraph: sorted by id, 15 by default", async () => {
		const { first, second } = await query("{ first: getTechnologies { id } second: getTechnologies(offset: 15, limit: 2) { id } }");
		expect(first).toHaveLength(15);
		const { all } = await query("{ all: getTechnologies(limit: 17) { id } }");
		expect(second).toEqual(all.slice(15, 17));
	});

	it("serves a profile with logos from the CDN", async () => {
		const { technologyById } = await query(`{ technologyById(id: "kubernetes") {
			id name icon logo website source documentation license status category
			learningResources { official } } }`);
		expect(technologyById).toMatchObject({
			id: "kubernetes",
			name: "Kubernetes",
			icon: "https://content.rawkode.academy/technologies/kubernetes/icon.svg",
			logo: "https://content.rawkode.academy/technologies/kubernetes/icon.svg",
			website: "https://kubernetes.io/",
			source: "https://github.com/kubernetes/kubernetes",
			license: "Apache-2.0",
			status: "stable",
		});
		expect(Array.isArray(technologyById.learningResources?.official ?? [])).toBe(true);
	});

	it("falls back like the website: no icon flag means no icon, but a logo URL", async () => {
		const { technologyById } = await query(`{ technologyById(id: "acorn") { icon logo documentation } }`);
		expect(technologyById.icon).toBeNull();
		expect(technologyById.logo).toBe("https://content.rawkode.academy/logos/technologies/acorn.svg");
	});

	it("resolves Technology entities for the gateway", async () => {
		const { _entities } = await query(`{ _entities(representations: [{ __typename: "Technology", id: "kubernetes" }]) { ... on Technology { name } } }`);
		expect(_entities).toEqual([{ name: "Kubernetes" }]);
	});
});

describe("technologies migrations", () => {
	it("upgrade a database created by the original service", async () => {
		const old = await migratedD1(join(import.meta.dir, ".."), "0000_acoustic_expediter.sql");
		await old.DB.prepare("INSERT INTO technologies (id, name, description) VALUES ('legacy', 'Legacy', 'Old')").run();
		await exec(old.DB, await readFile(join(import.meta.dir, "../data-model/migrations/0001_content_fields.sql"), "utf8"));
		expect(await old.DB.prepare("SELECT name, description FROM technologies WHERE id = 'legacy'").first()).toEqual({ name: "Legacy", description: "Old" });
		await loadFixtures(old.DB);
		expect((await old.DB.prepare("SELECT count(*) AS n FROM technologies").first<{ n: number }>())?.n).toBe(22);
		await old.dispose();
	});
});
