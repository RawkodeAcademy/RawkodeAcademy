import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "astro/zod";
import ts from "typescript";

const limit = vi.fn();
let attioApiKey: string | undefined;
const workerEnv = {
	PARTNERSHIP_FORM_RATE_LIMITER: { limit },
	ATTIO_INBOUND_DEAL_STAGE: undefined as string | undefined,
	ATTIO_INBOUND_DEAL_VALUE_USD: undefined as string | undefined,
	ATTIO_INBOUND_DEAL_OFFER_ATTRIBUTE: undefined as string | undefined,
	ATTIO_INBOUND_DEAL_OFFER_OPTION: undefined as string | undefined,
	ATTIO_SOURCE_ATTRIBUTE: undefined as string | undefined,
	ATTIO_SOURCE_VALUE: undefined as string | undefined,
};
const imports: Record<string, unknown> = {
	"astro:actions": { defineAction: (definition: unknown) => definition },
	"astro:env/server": {
		getSecret: (name: string) =>
			name === "ATTIO_API_KEY" ? attioApiKey : undefined,
	},
	"astro/zod": { z },
	"cloudflare:workers": { env: workerEnv },
	"@/lib/partnerships": {
		applicationPaths: [
			"90-day partnership",
			"First-run review",
			"Annual partnership",
			"Not sure yet",
		],
		applicationPathLabels: {
			"90-day partnership": "Full 90-day partnership",
			"First-run review": "First-run review",
			"Annual partnership": "Annual partnership",
			"Not sure yet": "Not sure yet",
		},
	},
};
const code = ts.transpileModule(
	readFileSync("src/actions/partnership.ts", "utf8"),
	{
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
		},
	},
).outputText;
type Action = {
	handler: (
		input: Record<string, unknown>,
		context: { request: Request },
	) => Promise<Record<string, unknown>>;
};
const exports: { partnership?: { apply: Action } } = {};
new Function("require", "exports", code)((id: string) => {
	if (!(id in imports)) throw new Error(`Unexpected import ${id}`);
	return imports[id];
}, exports);
const apply = exports.partnership!.apply;

const input = {
	name: "Ada Lovelace",
	email: "ada@analytical.engine",
	company: "Analytical Engine",
	path: "First-run review",
	message: "Please review our Kubernetes quick start.",
	website: "",
};
const context = {
	request: new Request("https://rawkode.academy/_actions/partnership.apply", {
		headers: { "CF-Connecting-IP": "192.0.2.10" },
	}),
};
const recordResponse = (recordId: string) =>
	new Response(JSON.stringify({ data: { id: { record_id: recordId } } }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
const requestBody = (call: readonly unknown[]) =>
	JSON.parse((call[1] as RequestInit).body as string);

beforeEach(() => {
	attioApiKey = "attio-test-key";
	workerEnv.ATTIO_INBOUND_DEAL_STAGE = undefined;
	workerEnv.ATTIO_INBOUND_DEAL_VALUE_USD = undefined;
	workerEnv.ATTIO_INBOUND_DEAL_OFFER_ATTRIBUTE = undefined;
	workerEnv.ATTIO_INBOUND_DEAL_OFFER_OPTION = undefined;
	workerEnv.ATTIO_SOURCE_ATTRIBUTE = undefined;
	workerEnv.ATTIO_SOURCE_VALUE = undefined;
	limit.mockReset().mockResolvedValue({ success: true });
	vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("partnership Attio action", () => {
	it("accepts honeypot submissions without touching Attio or PostHog", async () => {
		await expect(
			apply.handler({ ...input, website: "https://spam.test" }, context),
		).resolves.toEqual({ success: true, accepted: false });
		expect(limit).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});

	it("returns a mailto fallback when ATTIO_API_KEY is missing", async () => {
		attioApiKey = undefined;
		vi.spyOn(console, "error").mockImplementation(() => {});

		await expect(apply.handler(input, context)).resolves.toEqual({
			success: false,
			fallback: "mailto",
		});
		expect(limit).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
	});

	it("rate limits before writing CRM records", async () => {
		limit.mockResolvedValue({ success: false });

		await expect(apply.handler(input, context)).resolves.toEqual({
			success: false,
			rateLimited: true,
		});
		expect(limit).toHaveBeenCalledOnce();
		const key = limit.mock.calls[0]![0].key;
		expect(key).toMatch(/^[a-f0-9]{64}$/);
		expect(key).not.toContain(input.email);
		expect(fetch).not.toHaveBeenCalled();
	});

	it.each([
		["First-run review", 5000],
		["90-day partnership", 5000],
	])("writes person, company, note and a %s deal worth $%i", async (path, value) => {
		vi.mocked(fetch)
			.mockResolvedValueOnce(recordResponse("company-id"))
			.mockResolvedValueOnce(recordResponse("person-id"))
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(recordResponse("deal-id"));

		await expect(apply.handler({ ...input, path }, context)).resolves.toEqual({
			success: true,
			accepted: true,
		});
		expect(fetch).toHaveBeenCalledTimes(5);

		const calls = vi.mocked(fetch).mock.calls;
		const company = calls[0]!;
		const person = calls[1]!;
		const attribute = calls[2]!;
		const note = calls[3]!;
		const deal = calls[4]!;
		expect(company[0]).toBe(
			"https://api.attio.com/v2/objects/companies/records?matching_attribute=domains",
		);
		expect(requestBody(company)).toEqual({
			data: {
				values: {
					name: input.company,
					domains: ["analytical.engine"],
				},
			},
		});
		expect(person[0]).toBe(
			"https://api.attio.com/v2/objects/people/records?matching_attribute=email_addresses",
		);
		expect(requestBody(person).data.values.company[0].target_record_id).toBe(
			"company-id",
		);
		expect(attribute[0]).toBe(
			"https://api.attio.com/v2/objects/deals/attributes/source",
		);
		expect(note[0]).toBe("https://api.attio.com/v2/notes");
		expect(requestBody(note).data).toMatchObject({
			parent_object: "people",
			parent_record_id: "person-id",
			title: `Partnership enquiry: ${path === "90-day partnership" ? "Full 90-day partnership" : "First-run review"}`,
			content: input.message,
		});
		expect(deal[0]).toBe("https://api.attio.com/v2/objects/deals/records");
		expect(requestBody(deal).data.values).toMatchObject({
			stage: "In Progress",
			owner: "david@rawkode.academy",
			value,
			offer: "Review",
			source: "Inbound: partnerships page",
			associated_company: {
				target_object: "companies",
				target_record_id: "company-id",
			},
		});
		for (const call of vi.mocked(fetch).mock.calls) {
			expect((call[1] as RequestInit).headers).toMatchObject({
				Authorization: "Bearer attio-test-key",
			});
		}
	});

	it("keeps the core Attio writes when deal creation fails", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.mocked(fetch)
			.mockResolvedValueOnce(recordResponse("company-id"))
			.mockResolvedValueOnce(recordResponse("person-id"))
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(new Response(null, { status: 500 }));

		await expect(apply.handler(input, context)).resolves.toEqual({
			success: true,
			accepted: true,
		});
		expect(fetch).toHaveBeenCalledTimes(5);
	});

	it("uses the configured inbound deal stage", async () => {
		workerEnv.ATTIO_INBOUND_DEAL_STAGE = "Qualified";
		vi.mocked(fetch)
			.mockResolvedValueOnce(recordResponse("company-id"))
			.mockResolvedValueOnce(recordResponse("person-id"))
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(recordResponse("deal-id"));

		await apply.handler(input, context);

		const deal = vi.mocked(fetch).mock.calls[4]!;
		expect(requestBody(deal).data.values.stage).toBe("Qualified");
	});

	it("uses the configured deal value and Offer attribute slug", async () => {
		workerEnv.ATTIO_INBOUND_DEAL_VALUE_USD = "6500";
		workerEnv.ATTIO_INBOUND_DEAL_OFFER_ATTRIBUTE = "inbound_offer";
		workerEnv.ATTIO_INBOUND_DEAL_OFFER_OPTION = "Custom review";
		vi.mocked(fetch)
			.mockResolvedValueOnce(recordResponse("company-id"))
			.mockResolvedValueOnce(recordResponse("person-id"))
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(recordResponse("deal-id"));

		await apply.handler(input, context);

		const deal = vi.mocked(fetch).mock.calls[4]!;
		expect(requestBody(deal).data.values).toMatchObject({
			value: 6500,
			inbound_offer: "Custom review",
		});
	});

	it("uses configured source attribution when the Deal attribute exists", async () => {
		workerEnv.ATTIO_SOURCE_ATTRIBUTE = "lead_source";
		workerEnv.ATTIO_SOURCE_VALUE = "Website";
		vi.mocked(fetch)
			.mockResolvedValueOnce(recordResponse("company-id"))
			.mockResolvedValueOnce(recordResponse("person-id"))
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(recordResponse("deal-id"));

		await apply.handler(input, context);

		const calls = vi.mocked(fetch).mock.calls;
		expect(calls[2]![0]).toBe(
			"https://api.attio.com/v2/objects/deals/attributes/lead_source",
		);
		expect(requestBody(calls[3]!).data.title).not.toContain("Source");
		expect(requestBody(calls[4]!).data.values.lead_source).toBe("Website");
	});

	it("falls back to the note title when the source attribute is missing", async () => {
		vi.mocked(fetch)
			.mockResolvedValueOnce(recordResponse("company-id"))
			.mockResolvedValueOnce(recordResponse("person-id"))
			.mockResolvedValueOnce(new Response(null, { status: 404 }))
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(recordResponse("deal-id"));

		await expect(apply.handler(input, context)).resolves.toEqual({
			success: true,
			accepted: true,
		});

		const calls = vi.mocked(fetch).mock.calls;
		expect(requestBody(calls[3]!).data.title).toContain(
			"Source: Inbound: partnerships page",
		);
		expect(requestBody(calls[4]!).data.values).not.toHaveProperty("source");
	});

	it("returns a mailto fallback when a core Attio write fails", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 500 }));

		await expect(apply.handler(input, context)).resolves.toEqual({
			success: false,
			fallback: "mailto",
		});
		expect(fetch).toHaveBeenCalledOnce();
	});
});
