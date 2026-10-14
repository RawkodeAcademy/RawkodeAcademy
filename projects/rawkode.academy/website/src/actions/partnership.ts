import { defineAction } from "astro:actions";
import { getSecret } from "astro:env/server";
import { z } from "astro/zod";
import { env } from "cloudflare:workers";
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

const attioRequest = async <Response>(
	apiKey: string,
	path: string,
	method: "POST" | "PUT",
	values: Record<string, unknown>,
): Promise<Response> => {
	const response = await fetch(`${ATTIO_API_URL}${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
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
		const company = await attioRequest<AttioRecordResponse>(
			apiKey,
			"/objects/companies/records?matching_attribute=domains",
			"PUT",
			{
				name: input.company,
				domains: [emailDomain],
			},
		);
		const companyId = attioRecordId(company);

		const person = await attioRequest<AttioRecordResponse>(
			apiKey,
			"/objects/people/records?matching_attribute=email_addresses",
			"PUT",
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
		);
		const personId = attioRecordId(person);

		const sourceAttribute =
			env.ATTIO_SOURCE_ATTRIBUTE?.trim() || DEFAULT_SOURCE_ATTRIBUTE;
		const sourceValue = env.ATTIO_SOURCE_VALUE?.trim() || DEFAULT_SOURCE_VALUE;
		const hasSourceAttribute = await attioAttributeExists(
			apiKey,
			sourceAttribute,
		);

		const noteResponse = await fetch(`${ATTIO_API_URL}/notes`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				data: {
					parent_object: "people",
					parent_record_id: personId,
					title: hasSourceAttribute
						? `Partnership enquiry: ${applicationPathLabels[input.path]}`
						: `Partnership enquiry [Source: ${sourceValue}]: ${applicationPathLabels[input.path]}`,
					format: "plaintext",
					content: input.message,
				},
			}),
		});
		if (!noteResponse.ok) {
			throw new Error(
				`Attio note request failed with status ${noteResponse.status}`,
			);
		}

		const dealStage =
			env.ATTIO_INBOUND_DEAL_STAGE?.trim() || DEFAULT_DEAL_STAGE;
		// Attio's built-in deal value inherits its currency from the
		// workspace attribute, which David has configured as USD.
		const mappedDeal = applicationPathDeals[input.path];
		const offerAttribute =
			env.ATTIO_INBOUND_DEAL_OFFER_ATTRIBUTE?.trim() || DEFAULT_OFFER_ATTRIBUTE;
		try {
			await attioRequest(apiKey, "/objects/deals/records", "POST", {
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
