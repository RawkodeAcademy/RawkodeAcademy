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
	"Start with a £5,000 first-run review from David Flanagan of Rawkode Academy: a recorded first run of your product and a ranked list of what to fix, explain and teach, invoiced on delivery. Continue to the full 90-day partnership for £7,000 more only if it's useful.";

export const partnershipHeroTitle =
	"Find out where developers give up on your product.";

export const partnershipHeroLede =
	"Then decide what to fix, what to explain and what to teach, with David Flanagan, founder of Rawkode Academy.";

export const partnershipStartingPoint =
	"Every partnership starts with a first-run review. David works through your product the way a new user would, from first install or sign-up to a first working result, records every place he stalls and tells you plainly what he found. If that's useful, continue to the full 90 days: a live session on Rawkode Live with your engineer, a runnable example David writes, monthly working sessions and a day-90 read-out.";

export const organizationsStartingPoint = partnershipStartingPoint;

/** Example week-one numbers, so buyers can see what "agreed numbers" means. */
export const exampleMeasures =
	"For example: time from sign-up or install to a first successful deploy, quick-start completion rate, or the share of trials that are still active after a week.";

/** What the partner has in hand at day 90. The page leads with this. */
export const partnershipOutcomes = [
	{
		title: "A recorded first run",
		detail:
			"David works through your product from first install or sign-up to a first working result, as your target developer would, with the screen recorded and every stall point written down. Delivered in the first two weeks as part of the review.",
	},
	{
		title: "A ranked list of what to fix, explain and teach",
		detail:
			"Each friction point ranked by how much it costs developers and how hard it is to change, with a recommendation for each. Your product lead owns the list; David reviews progress with them every month.",
	},
	{
		title: "A live session on Rawkode Academy",
		detail:
			"David and your engineer teach one agreed use case live on Rawkode Live, labelled as a partner session. The recording stays published on Rawkode Academy and you can reuse it on your own channels.",
	},
	{
		title: "A runnable example, written by David",
		detail:
			"David writes the example repository for that use case against your product. Your engineer checks it is accurate. Fork it, publish it, put it in your docs.",
	},
	{
		title: "A before-and-after re-run",
		detail:
			"At day 90 David repeats the first run on what you've shipped since, and compares the two: time to a first working result and the number of stall points, before and after.",
	},
	{
		title: "A day-90 read-out",
		detail:
			"What changed, what the re-run, the session and your own numbers show, and what to work on next quarter. We report against two or three numbers you already track and the targets we set in week one. If we miss a target, the read-out says why.",
	},
] as const;

/** The fixed 90-day arc. The review is the first step. */
export const partnershipPlan: PartnershipStep[] = [
	{
		when: "Weeks 1–2 · first-run review",
		what: "Kick-off call. You give us a trial or sandbox account. We agree the numbers to watch and a target for each. David records the first run and delivers the friction log and ranked list within 10 business days, then walks your team through it in a one-hour call.",
	},
	{
		when: "Decide",
		what: "Within 30 days of the review call, continue to the full 90 days or stop. Either way you keep everything from the review.",
	},
	{
		when: "Month 2",
		what: "Agree the use case to teach. David writes the runnable example, your engineer reviews it, and we run the live session together. Monthly working session on the ranked list.",
	},
	{
		when: "Month 3",
		what: "David re-runs the first run on what you've shipped and compares it with the original. Day-90 read-out against the targets. Decide what to work on next quarter.",
	},
	{
		when: "From month 2",
		what: "Slack Connect with David for questions and second opinions on launches, docs, demos and roadmap trade-offs. Answers within two business days.",
	},
];

export const partnershipOffer: PartnershipOffer = {
	id: "partnership-90d",
	name: "Full 90-day partnership",
	label: "Work with Rawkode Academy",
	price: "£12,000",
	priceShort: "£12k/90 days",
	cadence:
		"Or US$15,600: the £5,000 (US$6,500) review, then £3,500 (US$4,550) a month for two months if you continue.",
	summary:
		"The review, plus the rest of the 90 days: a live session, a runnable example, monthly working sessions with written recaps, Slack with David, a before-and-after re-run and a day-90 read-out.",
	included: [
		"The first-run review: recorded first run, friction log and ranked list",
		"One live partner session on Rawkode Live, co-taught with your engineer",
		"One runnable example repository, written by David",
		"Monthly 60-minute working sessions with written recaps",
		"Slack Connect with David, answers within two business days",
		"A day-90 re-run of the first run, compared with the original",
		"A day-90 read-out against the targets we set in week one",
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
		title: "Stop after the review",
		detail:
			"The review is the first step and is priced on its own. It is invoiced when we deliver it, not before. If you stop there you have paid £5,000 (US$6,500) and keep the recording, the friction log and the ranked list. There is nothing to cancel.",
	},
	{
		title: "After day 90",
		detail:
			"Nothing renews automatically. If you want another 90 days, we agree it in writing: £12,000 for a fresh first run on what has changed, an updated ranked list, a new partner session and example, monthly working sessions and another re-run.",
	},
	{
		title: "Invoicing",
		detail:
			"The review is invoiced on delivery. If you continue, the remaining £7,000 (US$9,100) is invoiced as two monthly payments of £3,500 (US$4,550). Fixed prices in GBP or USD, EUR on request, 30-day payment terms. Prices exclude VAT where it applies.",
	},
	{
		title: "Paperwork",
		detail:
			"A one-page statement of work listing the deliverables, dates and targets, before you sign. It names the contracting entity and the liability cap. We can work under your MSA and sign your NDA.",
	},
	{
		title: "Access and data",
		detail:
			"We work from a trial or sandbox account and don't need production systems or customer data. Recordings are shared with you privately and we delete our copies 90 days after the work ends, or sooner if you ask. Slack Connect is a shared channel your admins control and can close at any time.",
	},
	{
		title: "If David can't make it",
		detail:
			"David does the work himself. If he can't deliver a scheduled item, we move the date with your agreement or refund that part of the fee.",
	},
	{
		title: "Ownership",
		detail:
			"You own the first-run recording, the friction log, the ranked list and the read-out. The example repository is licensed Apache 2.0, so you can use, change and ship it. You approve the session title and use case, can reuse the recording on your own channels, and can ask us to unlist it.",
	},
] as const;

/** First step of every partnership, independently useful. */
export const fitProofReview: PartnershipOffer = {
	id: "product-review",
	name: "First-run review",
	label: "Step one",
	price: "£5,000",
	priceShort: "£5k",
	cadence: "Or US$6,500. Delivered within 10 business days of access",
	summary:
		"The first step of every partnership, and useful on its own: David's recorded first run of your product and a written review you can act on whether or not you continue.",
	included: [
		"The screen recording of David's first run, from first install or sign-up to a first working result",
		"A friction log with every stall point and where it happened",
		"A ranked list of what to fix, explain and teach, with a recommendation for each",
		"Two or three numbers to watch, with a target for each",
		"A one-hour call to go through it with your team",
	],
	excluded: [
		"Ongoing Slack access, the live session and the runnable example",
		"Public coverage, product mentions or leads",
	],
	notes: [
		"Before starting we agree the product areas and who David is acting as. For products with more than one kind of user, such as a platform team and the application developers they serve, the review covers up to two.",
		"After the review call you have 30 days to decide. Continue to the full 90 days for £7,000 (US$9,100) more, or stop and keep everything.",
	],
	mailto: buildMailto("First-run review request", applicationBody),
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
	"First-run review",
	"Not sure yet",
] as const;
export type ApplicationPath = (typeof applicationPaths)[number];

/** Plain labels for form values and preselection links. */
export const applicationPathLabels: Record<ApplicationPath, string> = {
	"90-day partnership": partnershipOffer.name,
	"First-run review": fitProofReview.name,
	"Not sure yet": "Not sure yet",
};

/** Route values from earlier links that still preselect the right option. */
export const legacyApplicationPaths: Record<string, ApplicationPath> = {
	"Adoption Advisory": "90-day partnership",
	"Fit & Proof Review": "First-run review",
	"Product review": "First-run review",
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
