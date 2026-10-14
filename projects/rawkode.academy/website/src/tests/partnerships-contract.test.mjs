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
const header = readFileSync(
	new URL("../components/shell/AcademyHeader.astro", import.meta.url),
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
		/I review how engineers get started with your product and tell you what to fix first, in order of importance\. It's a fixed \$5,000\./,
	);
	assert.match(
		page,
		/I work with Datum Cloud today, and I've worked with Teleport, Heroku, Microsoft Azure and ngrok\./,
	);
	assert.match(
		page,
		/David Flanagan runs Rawkode Academy and Rawkode Live\. The Rawkode Academy YouTube channel has 28\.2K subscribers and over 370 hours of live streams\./,
	);
	assert.match(page, /Is this for you\?/);
	assert.match(
		page,
		/you build developer tools such as infrastructure tools, Kubernetes and cloud native projects, cloud platforms or AI infrastructure\./,
	);
	assert.match(page, /you're between seed and Series C\./);
	assert.match(
		page,
		/an engineer can install or sign up for your product and try it, including open-source projects installed from GitHub or Helm\./,
	);
	assert.match(page, /It's probably not for you if:/);
	assert.match(
		page,
		/engineers can't install or sign up for your product and try it\./,
	);
	assert.match(
		page,
		/you aren't a developer tools company between seed and Series C working in infrastructure, Kubernetes and cloud native, cloud platforms or AI\./,
	);
	assert.match(page, /you make a data tool\./);
	assert.match(page, /Who I've worked with/);
	assert.match(page, /<PartnerLogos \/>/);
	assert.doesNotMatch(page, /showCurrent=\{false\}/);
	assert.match(
		page,
		/You decide what each quarter covers, and you own the review, the report and the read-out\./,
	);
	assert.match(
		page,
		/Stop after the review and you have paid \$5,000, invoiced on delivery\. Stop at day 90 and there is nothing further to pay\. Nothing renews automatically\./,
	);
	assert.match(
		partnershipCopy,
		/If he can't deliver a scheduled item, we move the date with your agreement\./,
	);
	assert.doesNotMatch(partnershipCopy, /refund/i);
	assert.doesNotMatch(`${page}\n${partnershipCopy}\n${header}`, /champion/i);
	for (const quoteId of [
		"reggie-wilkerson",
		"jens-neuse",
		"solomon-hykes",
		"mikkel-hegnhoj",
	]) {
		assert.match(page, new RegExp(quoteId));
	}
	assert.match(
		page,
		/On advisory work: positioning, demos and ongoing guidance/,
	);
	assert.match(
		page,
		/On David's public walkthrough of WunderGraph on Rawkode Live/,
	);
	assert.match(page, /On having his product used live/);
	assert.match(
		page,
		/On Advent of Spin, the hands-on challenges Rawkode Academy created for Fermyon/,
	);
	assert.equal(page.match(/>Book a product review<\/a>/g)?.length, 2);
	assert.equal(header.match(/>Book a product review<\/a>/g)?.length, 1);
	assert.equal(page.match(/>Ask about the annual plan<\/a>/g)?.length, 1);
	assert.match(page, /href="\?route=Annual%20plan#apply"/);
	assert.deepEqual(
		Array.from(
			page.matchAll(/<a class="editorial-button"[^>]*>([^<]+)<\/a>/g),
			(match) => match[1].trim(),
		),
		[
			"Book a product review",
			"Ask about the annual plan",
			"Book a product review",
		],
	);
	assert.deepEqual(
		[
			...page.matchAll(/data-cta-location="([^"]+)"/g),
			...header.matchAll(/data-cta-location="([^"]+)"/g),
		].map((match) => match[1]),
		["hero", "annual", "end", "header"],
	);
	assert.match(page, /location: cta\.getAttribute\("data-cta-location"\)/);
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
	assert.match(
		partnershipCopy,
		/We start with a kick-off call, and you give us a trial or sandbox account\./,
	);
	assert.match(
		partnershipCopy,
		/At the day-90 read-out, we compare the results with the targets and decide what to work on next quarter\./,
	);
	assert.match(partnershipCopy, /Each quarter, you get an anonymised write-up/);
	assert.match(partnershipCopy, /Partners also get extras:/);
	assert.match(partnershipCopy, /"Slack Connect with David\."/);
	assert.doesNotMatch(
		partnershipCopy,
		/Slack Connect with David, answers within two business days/,
	);
	assert.match(
		partnershipCopy,
		/A day-90 review compared with the original, and a read-out against the targets set on the review call\./,
	);
	assert.doesNotMatch(
		partnershipCopy,
		/"A day-90 read-out against the targets set on the review call"/,
	);
	assert.match(
		partnershipCopy,
		/The partner session is clearly labelled as a partnership, and you get straight answers\./,
	);
	assert.doesNotMatch(partnershipCopy, /puff piece/);
	assert.match(partnershipCopy, /"A ranked list of what to fix first"/);
	assert.doesNotMatch(
		partnershipCopy,
		/A ranked list of what to fix first, in order of importance/,
	);
	assert.match(partnershipCopy, /and makes warm introductions\./);
	assert.doesNotMatch(partnershipCopy, /all-partner/i);
	assert.doesNotMatch(page, /all-partner/i);
	assert.doesNotMatch(`${page}\n${partnershipCopy}`, /partner call/i);
	assert.doesNotMatch(
		partnershipCopy,
		/warm introductions where they help both sides/,
	);
	assert.doesNotMatch(`${page}\n${partnershipCopy}`, /£|US\$/);

	const quotes = page.indexOf('id="partner-quotes"');
	const fit = page.indexOf('id="fit"');
	const deliverables = page.indexOf('id="what-you-get-title"');
	const process = page.indexOf('id="how-it-works-title"');
	const pricing = page.indexOf('id="pricing"');
	const control = page.indexOf('id="what-you-control"');
	const partners = page.indexOf('id="who-ive-worked-with"');
	const questions = page.indexOf('id="questions"');
	const enquiry = page.indexOf('id="apply"');
	const heroCta = page.indexOf('data-cta-location="hero"');
	const annualCta = page.indexOf('data-cta-location="annual"');
	const endCta = page.indexOf('data-cta-location="end"');

	assert(heroCta > -1);
	assert(heroCta < quotes);
	assert(quotes < fit);
	assert(fit < deliverables);
	assert(deliverables < process);
	assert(process < pricing);
	assert(pricing < control);
	assert(control < partners);
	assert(partners < questions);
	assert(questions < enquiry);
	assert(pricing < annualCta);
	assert(annualCta < control);
	assert(enquiry < endCta);
	assert.doesNotMatch(
		page,
		/id="sample"|<PartnershipProof \/>|See the 90 days/,
	);
	assert.match(page, /fitProofReview\.included\.map/);
	assert.match(page, /fitProofReview\.notes\.map/);
	assert.match(page, /partnershipOffer\.included\.map/);
	assert.match(page, /partnershipOffer\.excluded\.map/);
	assert.match(page, /class="editorial-card__body">Included:</);
	assert.match(page, /class="editorial-card__body">Not included:</);
	assert.match(page, /class="editorial-list"/);
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
	assert.match(page, /<details>/);
	assert.match(page, /<summary>/);
	assert.match(page, /summary \{/);
	assert.doesNotMatch(page, /Accordion/);
	assert.match(form, /capturePartnershipEvent\("enquiry_form_started"\)/);
	assert.match(form, /capturePartnershipEvent\("enquiry_form_submitted"\)/);
	assert.match(form, /action="\?_action=partnership\.applyForm"/);
	assert.match(form, /name="path"/);
	assert.doesNotMatch(form, /:disabled="!ready/);
	assert.match(partnershipCopy, /"First-run review": "Product review"/);
	assert.match(partnershipCopy, /"Fit & Proof Review": "Product review"/);
	assert.doesNotMatch(partnershipCopy, /"Product review": "First-run review"/);
	assert.match(partnershipCopy, /"Annual plan"/);
	assert.match(action, /applicationPathDeals/);
	assert.match(action, /accept: "form"/);
});
