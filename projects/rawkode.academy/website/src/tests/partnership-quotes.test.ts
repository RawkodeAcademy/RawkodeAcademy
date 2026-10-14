import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import {
	isVerbatimExcerpt,
	partnershipPullQuoteId,
	partnershipQuoteContext,
	partnershipQuoteExcerpts,
} from "@/lib/partnership-quotes";

const testimonialsDir = resolve("../../../content/testimonials");

const readTestimonial = (id: string) =>
	parseYaml(readFileSync(resolve(testimonialsDir, `${id}.yaml`), "utf-8")) as {
		quote: string;
	};

describe("partnership quotes", () => {
	for (const [id, excerpt] of Object.entries(partnershipQuoteExcerpts)) {
		it(`${id} is a verbatim excerpt of its testimonial`, () => {
			expect(isVerbatimExcerpt(readTestimonial(id).quote, excerpt)).toBe(true);
		});
	}

	it("every displayed quote has an excerpt", () => {
		expect(Object.keys(partnershipQuoteExcerpts)).toContain(
			partnershipPullQuoteId,
		);
		for (const id of Object.keys(partnershipQuoteContext)) {
			expect(Object.keys(partnershipQuoteExcerpts)).toContain(id);
		}
	});

	it("rejects a paraphrase", () => {
		expect(
			isVerbatimExcerpt(
				"Watching someone use your product live is useful.",
				"Watching someone use your product live is very useful.",
			),
		).toBe(false);
	});
});
