// Shapes the checked-in content the way Payload's REST API serves it after the
// static import: numeric IDs, relationships as IDs at depth 0, generated row IDs
// on arrays, and nulls for declared fields the source never set. Used to test
// and rehearse the export without a running Payload.
import { buildStaticSnapshot } from "../../../payload/src/static-content";
import type { DocsByCollection } from "./export";
import { ownedCollections, type PayloadDoc } from "./mapping";

const collections: string[] = [
	...ownedCollections,
	"chapters",
	"learning-resources",
];
const rowKeys = [
	"terms",
	"whatYouWillLearn",
	"aliases",
	"features",
	"relatedTechnologies",
	"useCases",
];

type Reference = { collection: string; legacyId: string };

// Shape records the way Payload stores and serves them: numeric IDs,
// relationships as IDs at depth 0, generated row IDs on arrays, and nulls for
// declared fields the source never set.
export async function simulatePayload(
	gitRoot: string,
): Promise<DocsByCollection> {
	const snapshot = await buildStaticSnapshot({ root: gitRoot });
	// Episodes are derived from videos; they only need IDs as relationship targets.
	const records = snapshot.records.filter((record) =>
		[...collections, "episodes"].includes(record.collection),
	);
	const ids = new Map<string, number>();
	for (const [position, record] of records.entries())
		ids.set(`${record.collection}:${record.legacyId}`, position + 1);
	const idOf = (reference: Reference) => {
		const id = ids.get(`${reference.collection}:${reference.legacyId}`);
		if (id === undefined)
			throw new Error(
				`Unresolved ${reference.collection}:${reference.legacyId}`,
			);
		return id;
	};
	let row = 0;
	const withRowIds = (value: unknown) =>
		Array.isArray(value)
			? value.map((item) =>
					item && typeof item === "object"
						? { ...item, id: `row-${++row}` }
						: item,
				)
			: value;

	const docs: DocsByCollection = Object.fromEntries(
		collections.map((name) => [name, []]),
	);
	for (const record of records) {
		const data: Record<string, unknown> = {
			title: null,
			description: null,
			tagline: null,
			...record.data,
		};
		for (const key of [
			...rowKeys,
			"links",
			"official",
			"community",
			"tutorials",
		])
			if (key in data) data[key] = withRowIds(data[key]);
		const relationships: Record<string, unknown> = {};
		for (const [field, value] of Object.entries(record.relationships ?? {})) {
			relationships[field] = Array.isArray(value)
				? value.map(idOf)
				: value
					? idOf(value)
					: null;
		}
		docs[record.collection]?.push({
			...data,
			...relationships,
			id: idOf(record),
			legacyId: record.legacyId,
			slug: record.slug,
			sourcePath: record.source?.path ?? null,
			sourceFormat: record.source?.format ?? null,
			sourceData: record.source?.data ?? null,
			sourceRaw: record.source?.raw ?? null,
			locallyEdited: false,
			_status: "published",
		} as PayloadDoc);
	}
	return docs;
}

// Every owned record as if an editor had saved it, forcing regeneration.
export const editedEverywhere = (docs: DocsByCollection): DocsByCollection =>
	Object.fromEntries(
		Object.entries(docs).map(([name, list]) => [
			name,
			list.map((doc) =>
				(ownedCollections as readonly string[]).includes(name)
					? { ...doc, locallyEdited: true }
					: doc,
			),
		]),
	);
