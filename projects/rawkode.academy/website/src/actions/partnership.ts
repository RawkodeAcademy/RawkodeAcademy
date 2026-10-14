import { defineAction } from "astro:actions";
import { getSecret } from "astro:env/server";
import { env } from "cloudflare:workers";
import { z } from "astro/zod";
import {
	applicationPathDeals,
	applicationPathLabels,
	applicationPaths,
} from "@/lib/partnerships";

const ATTIO_API_URL = "https://api.attio.com/v2";
const DEFAULT_DEAL_STAGE = "In Progress";
const DEFAULT_OFFER_ATTRIBUTE = "offer";
const DEFAULT_SOURCE_ATTRIBUTE = "source";
const DEFAULT_SOURCE_VALUE = "Inbound: partnerships page";
const DEAL_OWNER = "david@rawkode.academy";

interface AttioRecordResponse {
	data?: {
		id?: {
			record_id?: string;
		};
	};
}

interface AttioQueryResponse {
	data?: Array<{
		id?: {
			record_id?: string;
		};
	}>;
}

const attioHeaders = (apiKey: string) => ({
	Authorization: `Bearer ${apiKey}`,
	"Content-Type": "application/json",
});

const attioRequest = async <Response>(
	apiKey: string,
	path: string,
	values: Record<string, unknown>,
): Promise<Response> => {
	const response = await fetch(`${ATTIO_API_URL}${path}`, {
		method: "POST",
		headers: attioHeaders(apiKey),
		body: JSON.stringify({ data: { values } }),
	});

	if (!response.ok) {
		throw new Error(`Attio request failed with status ${response.status}`);
	}

	return response.json() as Promise<Response>;
};

const attioRecordId = (response: AttioRecordResponse): string => {
	const recordId = response.data?.id?.record_id;
	if (!recordId) {
		throw new Error("Attio response did not include a record ID");
	}
	return recordId;
};

const findRecordId = async (
	apiKey: string,
	object: "companies" | "people",
	filter: Record<string, string>,
): Promise<string | undefined> => {
	const response = await fetch(
		`${ATTIO_API_URL}/objects/${object}/records/query`,
		{
			method: "POST",
			headers: attioHeaders(apiKey),
			body: JSON.stringify({ filter, limit: 1 }),
		},
	);
	if (!response.ok) {
		throw new Error(`Attio query failed with status ${response.status}`);
	}
	const body = (await response.json()) as AttioQueryResponse;
	if (!Array.isArray(body.data)) {
		throw new Error("Attio query did not include records");
	}
	const [match] = body.data;
	if (!match) return undefined;
	const recordId = match.id?.record_id;
	if (!recordId) {
		throw new Error("Attio query did not include a record ID");
	}
	return recordId;
};

const createNote = async (
	apiKey: string,
	parentObject: "companies" | "people",
	parentRecordId: string,
	title: string,
	content: string,
) => {
	const response = await fetch(`${ATTIO_API_URL}/notes`, {
		method: "POST",
		headers: attioHeaders(apiKey),
		body: JSON.stringify({
			data: {
				parent_object: parentObject,
				parent_record_id: parentRecordId,
				title,
				format: "plaintext",
				content,
			},
		}),
	});
	if (!response.ok) {
		throw new Error(`Attio note request failed with status ${response.status}`);
	}
};

const attioAttributeExists = async (
	apiKey: string,
	attribute: string,
): Promise<boolean> => {
	try {
		const response = await fetch(
			`${ATTIO_API_URL}/objects/deals/attributes/${encodeURIComponent(attribute)}`,
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
			},
		);
		return response.ok;
	} catch {
		return false;
	}
};

const rateLimitKey = async (request: Request): Promise<string> => {
	const address =
		request.headers.get("CF-Connecting-IP") ??
		request.headers.get("x-forwarded-for") ??
		"unknown";
	const source = new TextEncoder().encode(`partnership-enquiry:${address}`);
	const digest = await crypto.subtle.digest("SHA-256", source);
	return Array.from(new Uint8Array(digest), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
};

const fallbackResponse = {
	success: false,
	fallback: "mailto",
} as const;

const companyReviewContent = (
	domain: string,
	companyName: string,
	email: string,
) =>
	[
		"A public partnership form matched this company by an unverified email domain.",
		`Email domain: ${domain}`,
		`Submitted company name: ${companyName}`,
		`Submitted email: ${email}`,
		"The company record was not changed. Review this match before relying on it.",
	].join("\n");

const personReviewContent = (
	name: string,
	email: string,
	companyName: string,
) =>
	[
		"A public partnership form matched this person by an unverified email address.",
		`Submitted name: ${name}`,
		`Submitted email: ${email}`,
		`Submitted company: ${companyName}`,
		"The person record was not changed. Review this match before relying on it.",
	].join("\n");

const enquiryInput = z.object({
	name: z.string().trim().min(1, "Please tell us your name").max(200),
	email: z.email("Please enter a valid work email"),
	company: z.string().trim().min(1, "Please tell us your company").max(1000),
	path: z.enum(applicationPaths),
	message: z.string().trim().min(1, "Please add a message").max(5000),
	website: z.string().trim().max(500).optional().default(""),
});

const saveEnquiry = async (
	input: z.infer<typeof enquiryInput>,
	context: { request: Request },
) => {
	if (input.website) {
		return { success: true, accepted: false } as const;
	}

	const apiKey = getSecret("ATTIO_API_KEY");
	if (!apiKey) {
		console.error("ATTIO_API_KEY is not configured");
		return fallbackResponse;
	}

	const rateLimit = await env.PARTNERSHIP_FORM_RATE_LIMITER.limit({
		key: await rateLimitKey(context.request),
	});
	if (!rateLimit.success) {
		return { success: false, rateLimited: true } as const;
	}

	const emailDomain = input.email.split("@")[1]?.toLowerCase();
	if (!emailDomain) {
		return fallbackResponse;
	}

	try {
		const emailAddress = input.email.toLowerCase();
		const existingCompanyId = await findRecordId(apiKey, "companies", {
			domains: emailDomain,
		});
		const companyId =
			existingCompanyId ??
			attioRecordId(
				await attioRequest<AttioRecordResponse>(
					apiKey,
					"/objects/companies/records",
					{
						name: input.company,
						domains: [emailDomain],
					},
				),
			);

		const existingPersonId = await findRecordId(apiKey, "people", {
			email_addresses: emailAddress,
		});
		const personId =
			existingPersonId ??
			attioRecordId(
				await attioRequest<AttioRecordResponse>(
					apiKey,
					"/objects/people/records",
					{
						name: [{ full_name: input.name }],
						email_addresses: [input.email],
						company: [
							{
								target_object: "companies",
								target_record_id: companyId,
							},
						],
					},
				),
			);

		const sourceAttribute =
			env.ATTIO_SOURCE_ATTRIBUTE?.trim() || DEFAULT_SOURCE_ATTRIBUTE;
		const sourceValue = env.ATTIO_SOURCE_VALUE?.trim() || DEFAULT_SOURCE_VALUE;
		const hasSourceAttribute = await attioAttributeExists(
			apiKey,
			sourceAttribute,
		);

		if (existingCompanyId) {
			await createNote(
				apiKey,
				"companies",
				existingCompanyId,
				"Review partnership enquiry: existing company",
				companyReviewContent(emailDomain, input.company, input.email),
			);
		}
		if (existingPersonId) {
			await createNote(
				apiKey,
				"people",
				existingPersonId,
				"Review partnership enquiry: existing person",
				personReviewContent(input.name, input.email, input.company),
			);
		}
		await createNote(
			apiKey,
			"people",
			personId,
			hasSourceAttribute
				? `Partnership enquiry: ${applicationPathLabels[input.path]}`
				: `Partnership enquiry [Source: ${sourceValue}]: ${applicationPathLabels[input.path]}`,
			input.message,
		);

		const dealStage =
			env.ATTIO_INBOUND_DEAL_STAGE?.trim() || DEFAULT_DEAL_STAGE;
		// Attio's built-in deal value inherits its currency from the
		// workspace attribute, which David has configured as USD.
		const mappedDeal = applicationPathDeals[input.path];
		const offerAttribute =
			env.ATTIO_INBOUND_DEAL_OFFER_ATTRIBUTE?.trim() || DEFAULT_OFFER_ATTRIBUTE;
		try {
			await attioRequest(apiKey, "/objects/deals/records", {
				name: `${input.company}: ${applicationPathLabels[input.path]}`,
				stage: dealStage,
				owner: DEAL_OWNER,
				value: mappedDeal.valueUsd,
				[offerAttribute]: mappedDeal.offer,
				...(hasSourceAttribute ? { [sourceAttribute]: sourceValue } : {}),
				associated_people: [
					{
						target_object: "people",
						target_record_id: personId,
					},
				],
				associated_company: {
					target_object: "companies",
					target_record_id: companyId,
				},
			});
		} catch (error) {
			console.error("Failed to create Attio deal:", error);
		}
	} catch (error) {
		console.error("Failed to save partnership enquiry in Attio:", error);
		return fallbackResponse;
	}

	return { success: true, accepted: true } as const;
};

export const partnership = {
	apply: defineAction({
		input: enquiryInput,
		handler: saveEnquiry,
	}),
	// Native form posts. The JSON action above stays for the hydrated client.
	applyForm: defineAction({
		accept: "form",
		input: enquiryInput,
		handler: saveEnquiry,
	}),
};
