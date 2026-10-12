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

export interface PartnershipStep {
	when: string;
	what: string;
}

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
	"Developers or platform teams you need to reach:",
	"What would you like to improve:",
	"Product, demo, docs, or repository:",
	"Funding stage and when you'd like to start:",
].join("\n");

/** Who the programme is for. Used in the hero eyebrow and search copy. */
export const partnershipAudience =
	"For developer-tool teams, seed to Series C, building for platform, cloud-native and AI-infrastructure engineers";

export const partnershipDescription =
	"A 90-day developer adoption partnership with David Flanagan of Rawkode Academy: a recorded first run of your product, a ranked fix list, a live Rawkode Academy session and a runnable example. £12,000, stop after month one if it isn't working.";

export const partnershipHeroTitle =
	"Find where developers get stuck. Decide what to fix. Teach the rest.";

export const partnershipHeroLede =
	"A 90-day partnership with David Flanagan, founder of Rawkode Academy.";

export const partnershipStartingPoint =
	"David uses your product the way a new user would, records every place he stalls and tells you plainly what he found. Then he helps your team decide what to change, what to explain and what to teach, and teaches one use case live to the Rawkode Academy audience with your engineer.";

export const organizationsStartingPoint = partnershipStartingPoint;

/** What the partner has in hand at day 90. The page leads with this. */
export const partnershipOutcomes = [
	{
		title: "A recorded first run",
		detail:
			"David works through your product from sign-up to a first working result, as your target developer would, with the screen recorded and every stall point written down. You get the recording and the friction log in the first two weeks.",
	},
	{
		title: "A ranked list of what to fix, explain and teach",
		detail:
			"Each friction point ranked by how much it costs developers and how hard it is to change, with a recommendation for each. Your product lead owns the list; we review it with them every month.",
	},
	{
		title: "A live session on Rawkode Academy",
		detail:
			"David and your engineer teach one agreed use case live on Rawkode Live, labelled as a partner session. The recording stays published on Rawkode Academy and you can reuse it on your own channels.",
	},
	{
		title: "A runnable example, written by us",
		detail:
			"We write the example repository for that use case against your product, under an open-source licence. Your engineer checks it is accurate. Fork it, publish it, put it in your docs.",
	},
	{
		title: "A day-90 read-out",
		detail:
			"What changed, what the session and the first run showed, and what to work on next quarter, reported against the two or three numbers and targets we agree in week one, using numbers you already track. If we miss a target, the read-out says why.",
	},
] as const;

/** The fixed 90-day arc. */
export const partnershipPlan: PartnershipStep[] = [
	{
		when: "Weeks 1–2",
		what: "Kick-off call. You give us a trial or sandbox account. We agree two or three numbers you already track and a target for each, then record the first run.",
	},
	{
		when: "Month 1 session",
		what: "Walk through the friction log and agree the ranked list. Pick the use case to teach.",
	},
	{
		when: "Month 2",
		what: "We write the runnable example. Your engineer reviews it. We prepare and run the live session together.",
	},
	{
		when: "Month 3 session",
		what: "Day-90 read-out. Decide what to work on next quarter, and whether to continue.",
	},
	{
		when: "Throughout",
		what: "Slack Connect for questions and second opinions on launches, docs, demos and roadmap trade-offs. Answers within two business days.",
	},
];

export const partnershipOffer: PartnershipOffer = {
	id: "partnership-90d",
	name: "90-day partnership",
	label: "Work with Rawkode Academy",
	price: "£12,000",
	priceShort: "£12k/90 days",
	cadence:
		"Or US$16,000. Invoiced monthly in advance. Stop after month one if it isn't working.",
	summary:
		"Everything above, plus David on Slack for the whole 90 days and a 60-minute working session each month with a written recap of decisions and next steps.",
	included: [
		"A recorded first run of your product and a written friction log",
		"A ranked list of what to fix, explain and teach, reviewed monthly",
		"One live partner session on Rawkode Live, co-taught with your engineer",
		"One runnable example repository, written by us, open source",
		"Three 60-minute working sessions with written recaps",
		"Slack Connect with David, answers within two business days",
		"A day-90 read-out against the numbers we agree in week one",
	],
	excluded: [
		"Building or fixing your product. Your team owns the changes.",
		"Guaranteed viewers, leads or praise. You get straight answers and a labelled partner session, not a puff piece.",
		"On-call support, extra sessions and maintaining the example after day 90, unless agreed separately.",
	],
	notes: [],
	mailto: buildMailto("90-day partnership", applicationBody),
};

/** Terms buyers, finance and procurement ask about. */
export const partnershipTerms = [
	{
		title: "Month-one break",
		detail:
			"After the first monthly session, either side can stop. You pay for month one only and keep the recording, the friction log and the first ranked list.",
	},
	{
		title: "After day 90",
		detail:
			"Stop at day 90 with nothing further to pay, or continue for another 90 days at the same price. Each further 90 days repeats the cycle on what has changed: a fresh first run, an updated ranked list, a new partner session and example, and three working sessions. Once you continue, you can stop with 30 days' notice.",
	},
	{
		title: "Invoicing",
		detail:
			"Monthly in advance, 30-day payment terms. Prices exclude VAT where it applies. Fixed prices in GBP or USD: £12,000 or US$16,000 for the partnership, £5,000 or US$6,500 for the review. EUR on request.",
	},
	{
		title: "Paperwork",
		detail:
			"A one-page statement of work listing the deliverables, dates and targets above, before you sign. It names the contracting entity. We can work under your MSA and sign your NDA.",
	},
	{
		title: "Access and data",
		detail:
			"We work from a trial or sandbox account. We don't need production systems or customer data. Slack Connect is a shared channel your admins control and can close at any time.",
	},
	{
		title: "Ownership",
		detail:
			"You own the first-run recording, the friction log, the ranked list and the read-out. The example repository is published under the Apache 2.0 licence. You approve the session title and use case, can reuse the recording on your own channels, and can ask us to unlist it.",
	},
] as const;

/** Entry offer, independently useful and credited towards the partnership. */
export const fitProofReview: PartnershipOffer = {
	id: "product-review",
	name: "Product review",
	label: "Want to see the work first?",
	price: "£5,000",
	priceShort: "£5k",
	cadence: "Or US$6,500. Delivered within 10 business days of access",
	summary:
		"The first part of the partnership on its own: David's recorded first run of your product and a written review you can act on whether or not you continue.",
	included: [
		"The screen recording of David's first run, from sign-up to a first working result",
		"A friction log with every stall point and where it happened",
		"A ranked list of what to fix, explain and teach, with a recommendation for each",
		"A one-hour call to go through it with your team",
	],
	excluded: [
		"Ongoing Slack access, the live session and the runnable example",
		"Public coverage, product mentions or leads",
	],
	notes: [
		"We agree the product areas and the developer we're acting as before starting.",
		"Start the partnership within 30 days of the review call and the full £5,000 counts towards it. The remaining £7,000 is invoiced as £3,500 in each of the first two months. The month-one break still applies: stop after month one and you have paid £8,500 in total.",
	],
	mailto: buildMailto("Product review request", applicationBody),
};

/**
 * Illustrative friction-log rows for a fictional product, so buyers can see
 * the format of the deliverable. Labelled as illustrative on the page.
 */
export const sampleFrictionLog = [
	{
		at: "04:10",
		step: "Install the CLI",
		finding:
			"The install script needs a newer glibc than the docs list. The error names a missing symbol, not the fix.",
		impact: "High",
		action: "Fix",
		recommendation:
			"Ship a static build and check the platform before installing.",
	},
	{
		at: "11:45",
		step: "Connect a cluster",
		finding:
			"The quick start assumes a kubeconfig context called default. Most developers have several contexts.",
		impact: "High",
		action: "Explain",
		recommendation:
			"Show the --context flag in the first command and print the active context on connect.",
	},
	{
		at: "23:30",
		step: "First deployment",
		finding:
			"The deploy succeeds but nothing says how to reach the service. The answer is in a GitHub issue.",
		impact: "Medium",
		action: "Teach",
		recommendation:
			"End the quick start with a port-forward and a curl, then link a guide on ingress.",
	},
] as const;

/** Compatibility shape for components that render the primary offer. */
export const partnershipTiers = [partnershipOffer] as const;
export const partnershipTierNames = partnershipTiers.map((offer) => offer.name);

/** Options for the application form's preferred route field. */
export const applicationPaths = [
	"90-day partnership",
	"Product review",
	"Not sure yet",
] as const;
export type ApplicationPath = (typeof applicationPaths)[number];

/** Plain labels for form values and preselection links. */
export const applicationPathLabels: Record<ApplicationPath, string> = {
	"90-day partnership": partnershipOffer.name,
	"Product review": fitProofReview.name,
	"Not sure yet": "Not sure yet",
};

/** Route values from earlier links that still preselect the right option. */
export const legacyApplicationPaths: Record<string, ApplicationPath> = {
	"Adoption Advisory": "90-day partnership",
	"Fit & Proof Review": "Product review",
};

/** Resolve a ?route= value, including legacy names, to a current path. */
export const resolveApplicationPath = (
	value: string | null | undefined,
): ApplicationPath | undefined => {
	if (!value) return undefined;
	if ((applicationPaths as readonly string[]).includes(value)) {
		return value as ApplicationPath;
	}
	return legacyApplicationPaths[value];
};

/** Boundaries for the full partnership programme. */
export const partnershipBoundaries = partnershipOffer.excluded;

/** General partnership application mailto used as a fallback. */
export const partnershipFitSubject = "Rawkode Academy partnership";
export const partnershipFitTemplate = applicationBody;
export const partnershipFitMailto = buildMailto(
	partnershipFitSubject,
	partnershipFitTemplate,
);

/** Decision brief used by the organisation hub and fit-check page. */
export const decisionBriefSubject = partnershipFitSubject;
export const decisionBriefTemplate = applicationBody;
export const decisionBriefMailto = partnershipFitMailto;
