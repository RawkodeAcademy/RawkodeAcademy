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
		/A private, recorded first run of your quick start by a Kubernetes practitioner, plus a ranked friction report\. \$5k, fixed price, no retainer\./,
	);
	assert.match(page, />Book a first-run review<\/a>/);
	assert.match(partnershipCopy, /price: "\$5,000"/);
	assert.match(partnershipCopy, /price: "\$12,000"/);
	assert.doesNotMatch(`${page}\n${partnershipCopy}`, /£|US\$/);

	const review = page.indexOf('id="review"');
	const programme = page.indexOf('id="programme"');
	const enquiry = page.indexOf('id="apply"');
	const sample = page.indexOf('id="sample"');
	const proof = page.indexOf("<PartnershipProof />");

	assert(review > -1);
	assert(review < programme);
	assert(programme < enquiry);
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
