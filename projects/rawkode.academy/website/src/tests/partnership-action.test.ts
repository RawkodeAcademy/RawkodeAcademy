import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "astro/zod";
import ts from "typescript";

const limit = vi.fn();
let attioApiKey: string | undefined;
const workerEnv = {
	PARTNERSHIP_FORM_RATE_LIMITER: { limit },
	ATTIO_INBOUND_DEAL_STAGE: undefined as string | undefined,
	ATTIO_INBOUND_DEAL_OFFER_ATTRIBUTE: undefined as string | undefined,
	ATTIO_SOURCE_ATTRIBUTE: undefined as string | undefined,
	ATTIO_SOURCE_VALUE: undefined as string | undefined,
};
const loadModule = (filename: string) => {
	const output = ts.transpileModule(readFileSync(filename, "utf8"), {
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
		},
	}).outputText;
	const module = { exports: {} as Record<string, unknown> };
	new Function("require", "module", "exports", output)(
		() => {
			throw new Error(`Unexpected import from ${filename}`);
		},
		module,
		module.exports,
	);
	return module.exports;
};
const partnerships = loadModule("src/lib/partnerships.ts") as {
	applicationPaths: readonly [
		"Product review",
		"90-day partnership",
		"Annual plan",
		"Not sure yet",
	];
	applicationPathLabels: Record<string, string>;
	applicationPathDeals: Record<string, { offer: string; valueUsd: number }>;
	resolveApplicationPath: (
		value: string | null | undefined,
	) => string | undefined;
};
const imports: Record<string, unknown> = {
	"astro:actions": { defineAction: (definition: unknown) => definition },
	"astro:env/server": {
		getSecret: (name: string) =>
			name === "ATTIO_API_KEY" ? attioApiKey : undefined,
	},
	"astro/zod": { z },
	"cloudflare:workers": { env: workerEnv },
	"@/lib/partnerships": partnerships,
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
	path: "Product review",
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
	workerEnv.ATTIO_INBOUND_DEAL_OFFER_ATTRIBUTE = undefined;
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
		["Product review", 5000, "Review"],
		["Not sure yet", 5000, "Review"],
		["90-day partnership", 12000, "Partnership (Quarterly)"],
		["Annual plan", 40000, "Partnership (Yearly)"],
	] as const)("writes person, company, note and a %s deal worth $%i offered as %s", async (path, value, offer) => {
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
			title: `Partnership enquiry: ${partnerships.applicationPathLabels[path]}`,
			content: input.message,
		});
		expect(deal[0]).toBe("https://api.attio.com/v2/objects/deals/records");
		expect(requestBody(deal).data.values).toMatchObject({
			stage: "In Progress",
			owner: "david@rawkode.academy",
			value,
			offer,
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

	it("renames the Offer attribute without changing the route's offer or value", async () => {
		workerEnv.ATTIO_INBOUND_DEAL_OFFER_ATTRIBUTE = "inbound_offer";
		vi.mocked(fetch)
			.mockResolvedValueOnce(recordResponse("company-id"))
			.mockResolvedValueOnce(recordResponse("person-id"))
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(recordResponse("deal-id"));

		await apply.handler({ ...input, path: "Annual plan" }, context);

		const deal = vi.mocked(fetch).mock.calls[4]!;
		expect(requestBody(deal).data.values).toMatchObject({
			value: 40000,
			inbound_offer: "Partnership (Yearly)",
		});
		expect(requestBody(deal).data.values).not.toHaveProperty("offer");
	});

	it("does not let env overrides replace a route's offer or value", () => {
		const actionSource = readFileSync("src/actions/partnership.ts", "utf8");
		const astroConfig = readFileSync("astro.config.mts", "utf8");
		const wrangler = readFileSync("wrangler.jsonc", "utf8");
		for (const source of [actionSource, astroConfig, wrangler]) {
			expect(source).not.toContain("ATTIO_INBOUND_DEAL_VALUE_USD");
			expect(source).not.toContain("ATTIO_INBOUND_DEAL_OFFER_OPTION");
		}
	});

	it("maps legacy route names onto the current options and prices", () => {
		expect([...partnerships.applicationPaths]).toEqual([
			"Product review",
			"90-day partnership",
			"Annual plan",
			"Not sure yet",
		]);
		expect(partnerships.applicationPathDeals).toEqual({
			"Product review": { offer: "Review", valueUsd: 5000 },
			"Not sure yet": { offer: "Review", valueUsd: 5000 },
			"90-day partnership": {
				offer: "Partnership (Quarterly)",
				valueUsd: 12000,
			},
			"Annual plan": { offer: "Partnership (Yearly)", valueUsd: 40000 },
		});
		expect(partnerships.resolveApplicationPath("First-run review")).toBe(
			"Product review",
		);
		expect(partnerships.resolveApplicationPath("Fit & Proof Review")).toBe(
			"Product review",
		);
		expect(partnerships.resolveApplicationPath("Product review")).toBe(
			"Product review",
		);
		expect(partnerships.resolveApplicationPath("Annual partnership")).toBe(
			"Annual plan",
		);
		expect(partnerships.resolveApplicationPath("Adoption Advisory")).toBe(
			"90-day partnership",
		);
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
