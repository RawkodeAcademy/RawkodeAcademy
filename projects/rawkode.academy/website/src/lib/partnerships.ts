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
	"What would you like to improve:",
	"Product, demo, docs, or repository:",
	"Budget and preferred start date:",
	"Links worth a look:",
].join("\n");

/**
 * The primary programme. Slack is a delivery channel, not an on-call
 * support promise. Demos and proof assets are deliberately bounded so the
 * partnership remains valuable without becoming an open-ended consultancy.
 */
export const partnershipDescription =
	"Work with Rawkode Academy for 90 days to understand what developers need and decide what to build, improve and explain. £12,000. Optional £5,000 product review.";

export const partnershipHeroLede =
	"Understand what they need, what’s changing, and where to focus next.";

export const partnershipStartingPoint =
	"Work with Rawkode Academy for 90 days. Bring an experienced outside perspective to the decisions your marketing, product and engineering teams make: which problems matter, what needs to improve, and how to explain your product clearly.";

export const organizationsStartingPoint =
	"Work with Rawkode Academy for 90 days to decide which developer problems matter, what to improve and how to explain your product clearly. Bring an experienced outside perspective to decisions across marketing, product and engineering as the work develops.";

export const partnershipOffer: PartnershipOffer = {
	id: "adoption-advisory",
	name: "90-day partnership",
	label: "Work with Rawkode Academy",
	price: "£12,000",
	priceShort: "£12k/90 days",
	cadence:
		"The first commitment is 90 days. If you start directly, it is billed at £4,000 per month. Before it ends, we agree together whether to continue for another 90 days.",
	summary:
		"Keep an experienced perspective involved as the work develops. Through Slack and monthly working sessions, we help you work through trade-offs, review what you have learned and revisit earlier advice. The context carries forward as your product changes and new questions come up.",
	included: [
		"Slack Connect for questions and feedback on the work we agree",
		"One 60-minute session each month to review progress and decide what to prioritise next",
		"A short written recap in Slack with decisions and next steps",
		"One webinar every 90 days, co-hosted by us and your technical expert",
		"One resource to go with the webinar: a short PDF guide or a code repository with an example developers can run",
	],
	excluded: [
		"On-call support and incident response are outside the partnership.",
		"We give honest feedback. Praise, leads and separate coverage are not guaranteed.",
		"Extra webinars, new integrations and ongoing code repository maintenance are outside the partnership.",
	],
	notes: [
		"The partnership also includes a joint webinar and a supporting resource to teach one agreed use case.",
	],
	mailto: buildMailto("90-day partnership application", applicationBody),
};

/** Usual starting point, independently useful and not required for every partner. */
export const fitProofReview: PartnershipOffer = {
	id: "fit-proof-review",
	name: "Product review",
	label: "Prefer to start with a smaller piece of work?",
	price: "£5,000",
	priceShort: "£5k",
	cadence: "Work agreed before starting",
	summary: "Start with a focused look at the developer experience.",
	included: [
		"A report on the developer experience and how to improve adoption",
		"Priorities for what to improve, explain and teach next",
		"A one-hour call to discuss the report and your questions",
	],
	excluded: [
		"Ongoing Slack access or building and fixing your product",
		"Public coverage, product mentions or leads",
	],
	notes: [
		"We agree the areas to review, access and a delivery date before starting. You can use the report whether or not you continue with the partnership.",
		"Start the partnership within 14 days of the review call and the full £5,000 review fee counts towards the first £12,000, 90-day commitment. That leaves £7,000 to pay. The review and first 90 days cost £12,000 in total. Where the review covers the work we agree, we use those findings instead of repeating it.",
	],
	mailto: buildMailto("Product review request", applicationBody),
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
	"Your team supplies and maintains the working environment and code needed for the webinar and runnable example. Your team builds the product and handles fixes.",
	"We provide advice and support on the work we agree, help plan the webinar and co-host it with your technical expert.",
	"We give honest feedback. Praise, leads and separate coverage are not guaranteed.",
	"On-call support and incident response are outside the partnership.",
	"Each 90 days includes one joint webinar and one PDF guide or runnable code example, alongside agreed advice and support. Extra webinars, new integrations and ongoing code repository maintenance are outside the partnership.",
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
