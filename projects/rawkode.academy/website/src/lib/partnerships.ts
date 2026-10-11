/**
 * Single source of truth for the Rawkode Academy partner programme.
 *
 * Every page that names the offer, quotes a price, or links a contact
 * mailto consumes this module so the public funnel cannot drift.
 */

export const PARTNERSHIP_EMAIL = "david@rawkode.academy";

/** Build an RFC 6068 mailto href with CRLF line breaks in the body. */
const buildMailto = (subject: string, body: string): string =>
	`mailto:${PARTNERSHIP_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace(/\n/g, "\r\n"))}`;

export interface PartnershipOffer {
	id: string;
	name: string;
	label: string;
	price: string;
	priceShort: string;
	cadence: string;
	summary: string;
	included: string[];
	excluded: string[];
	notes: string[];
	mailto: string;
}

const applicationBody = [
	"Name:",
	"Company and product:",
	"Target developers or platform teams:",
	"Who decides whether to use your product:",
	"What is difficult for developers using your product:",
	"Working demo, docs, or repository:",
	"Budget and preferred start date:",
	"Links worth a look:",
].join("\n");

/**
 * The primary programme. Slack is a delivery channel, not an on-call
 * support promise. Demos and proof assets are deliberately bounded so the
 * partnership remains valuable without becoming an open-ended consultancy.
 */
export const partnershipOffer: PartnershipOffer = {
	id: "adoption-advisory",
	name: "90-day partnership",
	label: "Work with Rawkode Academy",
	price: "£4,000 / month",
	priceShort: "£4k/mo",
	cadence:
		"First 90 days: £12,000 in total, billed monthly. We agree together whether to continue for another 90 days.",
	summary:
		"Work directly with David to improve your demo and documentation. Get ongoing technical advice, plus a joint webinar and a practical resource developers can use.",
	included: [
		"Slack Connect to ask David questions and get feedback on the agreed use case",
		"One 60-minute session with David each month to review questions and decide what to do next",
		"One webinar every 90 days, co-hosted by David and your technical expert",
		"One resource to go with the webinar: a short PDF guide or a code repository with an example developers can run",
		"A short written recap in Slack with decisions and next steps",
	],
	excluded: [
		"On-call support, incident response, running your developer relations team and managing campaigns are outside the partnership.",
		"David gives honest feedback. Praise, leads and separate coverage are not guaranteed.",
		"Extra webinars, new integrations and ongoing code repository maintenance are outside the partnership.",
	],
	notes: [
		"Together, we'll choose a useful technical topic and turn it into a webinar and a practical resource developers can use.",
	],
	mailto: buildMailto("90-day partnership application", applicationBody),
};

/** Optional paid qualification route. It is not required for every partner. */
export const fitProofReview: PartnershipOffer = {
	id: "fit-proof-review",
	name: "Product demo review",
	label: "Optional starting point",
	price: "£2,500",
	priceShort: "£2.5k",
	cadence: "One agreed use case",
	summary: "Find out where developers get stuck when trying your product.",
	included: [
		"David tries one agreed use case using your demo and documentation",
		"A written list of what is confusing, what is missing and what to fix first",
		"A one-hour call with David to go through the findings and your questions",
	],
	excluded: [
		"Ongoing Slack access or building and fixing your product",
		"Public coverage, product mentions or leads",
	],
	notes: [
		"We agree the use case, demo, documentation and delivery date before starting. You can use the written findings whether or not you continue with the partnership.",
		"The full £2,500 comes off your first partnership invoice if you start within 30 days of our call. For the same use case, the review is our starting point, so we do not repeat it when the partnership begins.",
	],
	mailto: buildMailto("Product demo review request", applicationBody),
};

/** Compatibility shape for components that render the primary offer. */
export const partnershipTiers = [partnershipOffer] as const;
export const partnershipTierNames = partnershipTiers.map((offer) => offer.name);

/** Options for the application form's preferred route field. */
export const applicationPaths = [
	"Adoption Advisory",
	"Fit & Proof Review",
	"Not sure yet",
] as const;
export type ApplicationPath = (typeof applicationPaths)[number];

/** Plain labels for existing form values and preselection links. */
export const applicationPathLabels: Record<ApplicationPath, string> = {
	"Adoption Advisory": partnershipOffer.name,
	"Fit & Proof Review": fitProofReview.name,
	"Not sure yet": "Not sure yet",
};

/** Boundaries for the full partnership programme. */
export const partnershipBoundaries = [
	"Your team supplies and maintains the demo, environment, code and integrations. Your team builds the product and fixes problems.",
	"David answers technical questions, reviews the demo, helps plan the webinar and co-hosts it with your technical expert.",
	"David gives honest feedback. Praise, leads and separate coverage are not guaranteed.",
	"On-call support, incident response, running your developer relations team and managing campaigns are outside the partnership.",
	"Each 90 days covers one agreed use case, one joint webinar and one PDF guide or runnable code example. Extra webinars, new integrations and ongoing code repository maintenance are outside the partnership.",
	"Exclusivity needs a separate agreement on the work and price.",
] as const;

/** General partnership application mailto used as a fallback. */
export const partnershipFitSubject = "Rawkode Academy partner application";
export const partnershipFitTemplate = applicationBody;
export const partnershipFitMailto = buildMailto(
	partnershipFitSubject,
	partnershipFitTemplate,
);

/** Decision brief used by the organisation hub and fit-check page. */
export const decisionBriefSubject = partnershipFitSubject;
export const decisionBriefTemplate = applicationBody;
export const decisionBriefMailto = partnershipFitMailto;
