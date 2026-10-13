import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const page = readFileSync(
	new URL("../pages/organizations/partnerships/index.astro", import.meta.url),
	"utf8",
);
const form = readFileSync(
	new URL(
		"../components/organizations/PartnershipApplicationForm.vue",
		import.meta.url,
	),
	"utf8",
);
const action = readFileSync(
	new URL("../actions/partnership.ts", import.meta.url),
	"utf8",
);
const partnershipCopy = readFileSync(
	new URL("../lib/partnerships.ts", import.meta.url),
	"utf8",
);

test("partnership page uses the approved landing hero and one CTA", () => {
	assert.match(page, /eyebrow="Partnerships"/);
	assert.match(
		page,
		/See exactly where engineers get stuck with your product\./,
	);
	assert.match(
		page,
		/I install and use your product the way your users would, record the whole session, and send you a list of what to fix first\. It costs a fixed \$5,000\./,
	);
	assert.match(
		page,
		/I work with Datum Cloud today, and I've worked with Teleport, Heroku, Microsoft Azure and ngrok\./,
	);
	assert.equal(page.match(/>Book a product review<\/a>/g)?.length, 3);
	assert.deepEqual(
		Array.from(page.matchAll(/<a [^>]*>([^<]+)<\/a>/g), (match) =>
			match[1].trim(),
		),
		["Book a product review", "Book a product review", "Book a product review"],
	);
	assert.match(partnershipCopy, /price: "\$5,000"/);
	assert.match(partnershipCopy, /price: "\$12,000"/);
	assert.match(partnershipCopy, /price: "\$40,000 a year"/);
	assert.match(
		partnershipCopy,
		/It costs \$40,000 a year, billed at \$10,000 a quarter/,
	);
	assert.match(
		partnershipCopy,
		/Your monthly 60-minute working sessions with David run all year too/,
	);
	assert.match(partnershipCopy, /exclude VAT where it applies/);
	assert.doesNotMatch(`${page}\n${partnershipCopy}`, /£|US\$/);

	const deliverables = page.indexOf('id="what-you-get-title"');
	const process = page.indexOf('id="how-it-works-title"');
	const pricing = page.indexOf('id="pricing"');
	const partners = page.indexOf('id="past-partners-title"');
	const enquiry = page.indexOf('id="apply"');

	assert(deliverables > -1);
	assert(deliverables < process);
	assert(process < pricing);
	assert(pricing < partners);
	assert(partners < enquiry);
	assert.doesNotMatch(
		page,
		/id="sample"|<PartnershipProof \/>|See the 90 days/,
	);
});

test("partnership enquiry is short and tracks its conversion steps", () => {
	for (const field of ["name", "email", "company", "message"]) {
		assert.match(form, new RegExp(`name="${field}"`));
	}
	for (const removedField of [
		"targetDevelopers",
		"technicalBuyer",
		"proofAssets",
		"budgetQuarter",
	]) {
		assert.doesNotMatch(form, new RegExp(`name="${removedField}"`));
	}
	assert.match(form, /name="website"/);
	assert.match(form, /class="form-honeypot"/);
	assert.doesNotMatch(form, /api\.attio\.com/);
	assert.match(action, /https:\/\/api\.attio\.com\/v2/);
	assert.match(page, /capture\("cta_clicked"/);
	assert.match(form, /capturePartnershipEvent\("partnership_form_started"\)/);
	assert.match(form, /capturePartnershipEvent\("partnership_form_submitted"\)/);
});
