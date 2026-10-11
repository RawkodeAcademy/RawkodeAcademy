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
	"Technical buyer:",
	"Current adoption challenge:",
	"Working demo, docs, or repository:",
	"Budget and preferred quarter:",
	"Links worth a look:",
].join("\n");

/**
 * The primary programme. Slack is a delivery channel, not an on-call
 * support promise. Demos and proof assets are deliberately bounded so the
 * partnership remains valuable without becoming an open-ended consultancy.
 */
export const partnershipOffer: PartnershipOffer = {
	id: "adoption-advisory",
	name: "Adoption Advisory",
	label: "Rawkode Partner Programme",
	price: "£4,000 / month",
	priceShort: "£4k/mo",
	cadence:
		"Initial 90-day cycle: £12,000 total, billed monthly. Renewal: further 90-day cycles, agreed together.",
	summary:
		"A working partnership for infrastructure companies with a technical workflow they need buyers to understand. Get a practitioner's feedback, improve the demonstration and create useful material your team can reuse.",
	included: [
		"Slack Connect for technical questions, reviews and decisions about the agreed workflow",
		"One 60-minute working session each month, with decisions and next actions shared in Slack",
		"One recorded technical walkthrough of up to 45 minutes, using your team's working demo",
		"A lightly edited master recording",
		"One companion page of up to 500 words, using a standard format and the agreed source material",
		"Two clips of up to 90 seconds each, taken from the same recording",
		"One consolidated correction round and a shared folder containing the final assets",
		"A one-page quarterly summary, discussed in that month's working session",
	],
	excluded: [
		"On-call support, incident response, outsourced DevRel and campaign management are outside the programme.",
		"The work is paid for; the technical judgement stays independent. There is no guarantee of praise, leads or separate editorial coverage.",
		"The package covers one workflow and one recording per cycle. Additional recordings, bespoke articles, new integrations and ongoing repository maintenance are scoped separately.",
		"New creative direction, additional formats and reshoots caused by changed requirements are scoped separately.",
	],
	notes: [
		"Before the cycle starts, we agree the workflow, what the demonstration needs to show, the materials your team will supply and the delivery dates.",
	],
	mailto: buildMailto("Adoption Advisory application", applicationBody),
};

/** Optional paid qualification route. It is not required for every partner. */
export const fitProofReview: PartnershipOffer = {
	id: "fit-proof-review",
	name: "Fit & Proof Review",
	label: "Optional qualification",
	price: "£2,500",
	priceShort: "£2.5k",
	cadence: "One fixed-scope review",
	summary:
		"Find the gaps in one important technical evaluation journey. David reviews the agreed demonstration and supporting materials, identifies the three most important proof gaps and recommends what to fix or demonstrate next.",
	included: [
		"One named technical workflow and its current proof gaps",
		"An agreed set of demo, documentation and adoption materials, reviewed asynchronously",
		"A written scorecard and prioritised next-step plan",
		"One 60-minute readout",
	],
	excluded: [
		"Open-ended Slack access or implementation work",
		"Coverage, mentions, lead generation, or audience rental",
	],
	notes: [
		"We agree the materials and delivery date before the review begins. The findings and next-step plan are yours to use whether or not you continue with Adoption Advisory.",
		"The full £2,500 is credited against your first Adoption Advisory invoice when the partnership starts within 30 days of the readout. If you continue with the same workflow, the review becomes your onboarding, so we can start from its findings rather than repeat discovery.",
	],
	mailto: buildMailto("Fit & Proof Review application", applicationBody),
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

/** Boundaries for the full partnership programme. */
export const partnershipBoundaries = [
	"Your team supplies and maintains the working demo, environment, code and integrations. Product fixes and implementation stay with your team.",
	"David provides technical critique, shapes and hosts the walkthrough, and produces the agreed recording and companion materials.",
	"The work is paid for; the technical judgement stays independent. There is no guarantee of praise, leads or separate editorial coverage.",
	"On-call support, incident response, outsourced DevRel and campaign management are outside the programme.",
	"The package covers one workflow and one recording per cycle. Additional recordings, bespoke articles, new integrations and ongoing repository maintenance are scoped separately.",
	"Exclusivity is considered only for a specifically agreed scope and price.",
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
