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

test("partnership page leads with the private fixed-price review", () => {
	assert.match(
		page,
		/David, a Kubernetes practitioner, works through your quick start privately and on the record, then sends you a ranked report of where developers get stuck\. It costs a fixed \$5,000, with no retainer\./,
	);
	assert.match(page, />Book a first-run review<\/a>/);
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

	const review = page.indexOf('id="review"');
	const programme = page.indexOf('id="programme"');
	const annual = page.indexOf('id="annual"');
	const enquiry = page.indexOf('id="apply"');
	const sample = page.indexOf('id="sample"');
	const proof = page.indexOf("<PartnershipProof />");

	assert(review > -1);
	assert(review < programme);
	assert(programme < annual);
	assert(annual < enquiry);
	assert(enquiry < sample);
	assert(sample < proof);
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
