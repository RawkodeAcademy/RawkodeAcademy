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

/**
 * Capacity. David does every review and partnership himself, so places are
 * capped. The page prints these numbers as written: update `active` and
 * `asOf` by hand whenever a review starts or a partnership ends, and never
 * lower `places` or raise `active` to manufacture urgency.
 */
export const partnershipCapacity = {
	/** Partners (including reviews in progress) David works with at once. */
	places: 6,
	/** Places taken today. */
	active: 0,
	/** New first-run reviews David can start in a calendar month. */
	newStartsPerMonth: 2,
	asOf: "12 October 2026",
	/** Week the next review can start, e.g. "2 November 2026". Leave null until known. */
	nextStart: null as string | null,
} as const;

export const partnershipPlacesOpen = Math.max(
	0,
	partnershipCapacity.places - partnershipCapacity.active,
);

export const partnershipIsFull = partnershipPlacesOpen === 0;

/** One-line capacity statement used in the hero. */
export const partnershipCapacitySummary = `At most ${partnershipCapacity.places} partners at a time and ${partnershipCapacity.newStartsPerMonth} new reviews a month, because David does the work himself.${partnershipCapacity.nextStart ? ` Next review start: week of ${partnershipCapacity.nextStart}.` : ""}`;

/**
 * Current availability, worded for the page. While no places are taken the
 * page states the limits and the booking order rather than a count.
 */
export const partnershipAvailability = partnershipIsFull
	? `All ${partnershipCapacity.places} places are taken as of ${partnershipCapacity.asOf}. Apply to join the waiting list; places go in the order reviews are booked.`
	: partnershipCapacity.active > 0
		? `${partnershipPlacesOpen} of ${partnershipCapacity.places} places open as of ${partnershipCapacity.asOf}. Places go in the order reviews are booked.`
		: `Reviews start in the order they're booked, ${partnershipCapacity.newStartsPerMonth} a month. Once ${partnershipCapacity.places} partners are in progress, new reviews wait for a place.`;

/** Where the first-run review method comes from. */
export const partnershipMethodNote =
	"David has worked through new tools for the first time, live and unscripted, on Rawkode Live since 2020. The first-run review is the same work done privately, timed and written up as a ranked list.";

/** Who the programme is for. Used in the hero eyebrow and search copy. */
export const partnershipAudience =
	"For developer-tool teams, seed to Series C, building for platform, cloud-native and AI-infrastructure engineers";

export const partnershipDescription =
	"Start with a $5,000 first-run review from David Flanagan of Rawkode Academy: a recorded first run of your product and a ranked list of what to fix, explain and teach, invoiced on delivery. Continue to the full 90-day partnership for $7,000 more only if it's useful.";

export const partnershipHeroTitle =
	"Find out where developers give up on your product.";

export const partnershipHeroLede =
	"Then decide what to fix, what to explain and what to teach, with David Flanagan, founder of Rawkode Academy.";

export const partnershipStartingPoint =
	"Every partnership starts with a first-run review. David works through your product as a new user would, records every place he stalls and tells you plainly what he found. Delivered in 10 business days, invoiced on delivery. Continue to the full 90 days only if it's useful.";

export const organizationsStartingPoint = partnershipStartingPoint;

/** Example numbers to watch, so buyers can see what "agreed numbers" means. */
export const exampleMeasures =
	"For example: time from sign-up or install to a first successful deploy, quick-start completion rate, or the share of trials that are still active after a week.";

/** What the partner has in hand at day 90. The page leads with this. */
export const partnershipOutcomes = [
	{
		title: "A recorded first run",
		inReview: true,
		detail:
			"David works through your product from first install or sign-up to a first working result, as your target developer would, with the screen recorded and every stall point written down. Delivered in the first two weeks as part of the review.",
	},
	{
		title: "A ranked list of what to fix, explain and teach",
		inReview: true,
		detail:
			"Each friction point ranked by how much it costs developers and how hard it is to change, with a recommendation for each. Your product lead owns the list; David reviews progress with them every month.",
	},
	{
		title: "A live session on Rawkode Academy",
		inReview: false,
		detail:
			"David and your engineer teach one agreed use case live on Rawkode Live, labelled as a partner session. The recording stays published on Rawkode Academy and you can reuse it on your own channels.",
	},
	{
		title: "A runnable example, written by David",
		inReview: false,
		detail:
			"David writes the example repository for that use case against your product. Your engineer checks it is accurate. Fork it, publish it, put it in your docs.",
	},
	{
		title: "A before-and-after re-run",
		inReview: false,
		detail:
			"At day 90 David repeats the first run on what you've shipped since and checks every stall point in the original log: fixed, improved or still there. You get the count before and after, not just an impression.",
	},
	{
		title: "A day-90 read-out",
		inReview: false,
		detail:
			"What changed, what the re-run, the session and your own numbers show, and what to work on next quarter. We report against two or three numbers you already track and the targets set on the review call. If we miss a target, the read-out says why.",
	},
] as const;

/** Monthly call for every current partner. Part of the full 90 days. */
export const partnershipGroupCall = {
	title: "A monthly all-partner call",
	detail:
		"One hour each month with David and the other current partners on what's changing in cloud-native, platform engineering, AI infrastructure and developer tools, and what it means for your roadmap. Not recorded, and nothing said is repeated outside the call. Until three partners are active, it runs as a one-to-one industry briefing with David.",
} as const;

export interface PartnershipPerk {
	title: string;
	detail: string;
}

/**
 * Extras in the full 90 days. Each is small and bounded so six partners stay
 * deliverable. Anything an audience sees is labelled as partner content.
 */
export const partnershipPerks: PartnershipPerk[] = [
	{
		title: "Fix checks",
		detail:
			"Ship a fix for something on your ranked list and David re-tests that step himself within five business days, so you know it worked before the day-90 re-run. Up to three a quarter.",
	},
	{
		title: "Launch pre-flight",
		detail:
			"Before one launch a quarter, David does a recorded first run of the new feature or quick start and sends you the three things most likely to trip developers up. Give us 10 business days' notice. It doesn't mean David will cover the launch publicly.",
	},
	{
		title: "Champion pack",
		detail:
			"At day 90, a one-page before-and-after summary and a five-minute video walkthrough from David that your champion can forward to the CEO or board. If you publish it, it stays marked as prepared under a paid partnership.",
	},
	{
		title: "Cross-partner patterns",
		detail:
			"Each quarter, an anonymised write-up of the friction patterns David saw across every partner's first run, so you can compare your onboarding with your peers'. No product is named. It starts once three partners are active.",
	},
	{
		title: "The Technology Matrix, walked through",
		detail:
			"The Technology Matrix is Rawkode Academy's written, opinionated radar of cloud-native, platform and AI-infrastructure tools. Each all-partner call starts with what has moved on it and why.",
	},
	{
		title: "Your example in the Academy",
		detail:
			"The runnable example David writes for you is listed in the resources of the matching Rawkode Academy technology page or course, marked as a partner example.",
	},
	{
		title: "An accurate technology page",
		detail:
			"David checks your product's entry in the Rawkode Academy technology catalogue and fixes outdated facts, with a line saying you are a current partner. Corrections only, not marketing copy.",
	},
	{
		title: "A partner note in the newsletter",
		detail:
			"Once per 90 days, a short technical note from your team, such as the example repository or the partner session, appears in the Rawkode Academy newsletter, marked as a partner note. David checks it for accuracy.",
	},
	{
		title: "A partner AMA on Discord",
		detail:
			"Once per 90 days, a labelled partner AMA in the Rawkode Academy Discord, hosted by David with your engineer.",
	},
	{
		title: "Warm introductions",
		detail:
			"Up to two a quarter, to maintainers, practitioners or other partners you want to reach, made only where David thinks both sides benefit and both agree.",
	},
];

/** Extras for partners who continue past the first 90 days. */
export const renewalPerks: PartnershipPerk[] = [
	{
		title: "First refusal on your place",
		detail:
			"Current partners keep their place for the next 90 days and get review start dates before anyone on the waiting list.",
	},
	{
		title: "A guest article",
		detail:
			"Your engineer publishes one technical article on Rawkode Academy, marked as partner content and edited by David for accuracy. Product pitches get sent back.",
	},
	{
		title: "A Klustered partner special",
		detail:
			"Your team joins a Klustered episode, breaking and fixing clusters live, labelled as a partner special.",
	},
	{
		title: "Opt-in contact from your session",
		detail:
			"Developers who sign up for your partner session's materials can choose to hear from your team. The box is unticked by default and covered in the statement of work.",
	},
	{
		title: "Listed as a current partner",
		detail:
			"With your permission, your logo appears under current partners on this page while the partnership runs.",
	},
];

/** The fixed 90-day arc. The review is the first step. */
export const partnershipPlan: PartnershipStep[] = [
	{
		when: "Weeks 1–2 · first-run review",
		what: "Kick-off call. You give us a trial or sandbox account. We agree the numbers to watch; targets are set on the review call, once the findings exist. David records the first run and delivers the friction log and ranked list within 10 business days, then walks your team through it in a one-hour call, checking the list against your own funnel numbers.",
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
		what: "David re-runs the first run on what you've shipped and checks each original stall point. Day-90 read-out against the targets. Decide what to work on next quarter.",
	},
	{
		when: "From month 2",
		what: "Slack Connect with David for questions and second opinions on launches, docs, demos and roadmap trade-offs. Answers within two business days. A monthly all-partner call on what's changing across the industry.",
	},
];

export const partnershipOffer: PartnershipOffer = {
	id: "partnership-90d",
	name: "Full 90-day partnership",
	label: "Work with Rawkode Academy",
	price: "$12,000",
	priceShort: "$12k/90 days",
	cadence:
		"Fixed price. The $5,000 review counts towards it, so continuing costs $7,000 more: $3,500 a month for two months.",
	summary:
		"The review, plus the rest of the 90 days: a live session, a runnable example, monthly working sessions with written recaps, Slack with David, the monthly all-partner call, a before-and-after re-run and a day-90 read-out.",
	included: [
		"The first-run review: recorded first run, friction log and ranked list",
		"One live partner session on Rawkode Live, co-taught with your engineer",
		"One runnable example repository, written by David",
		"Monthly 60-minute working sessions with written recaps",
		"Slack Connect with David, answers within two business days",
		"A monthly all-partner call with David and the other current partners on industry changes",
		"Partner extras: fix checks, a launch pre-flight, a champion pack for your board, labelled newsletter and Discord slots, and warm introductions",
		"A day-90 re-run of the first run, compared with the original",
		"A day-90 read-out against the targets set on the review call",
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
			"The review is the first step and is priced on its own. It is invoiced when we deliver it, not before. If you stop there you have paid $5,000 and keep the recording, the friction log and the ranked list. There is nothing to cancel.",
	},
	{
		title: "After day 90",
		detail:
			"Nothing renews automatically. If you want another 90 days, we agree it in writing: $12,000 for a fresh first run on what has changed, an updated ranked list, a new partner session and example, monthly working sessions, the all-partner call and another re-run.",
	},
	{
		title: "Invoicing",
		detail:
			"The review is invoiced on delivery. If you continue, the remaining $7,000 is invoiced as two monthly payments of $3,500. Fixed prices in USD, 30-day payment terms. Prices exclude tax where it applies.",
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
	price: "$5,000",
	priceShort: "$5k",
	cadence: "Fixed price. Delivered within 10 business days of access",
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
		"Ongoing Slack access, the all-partner call, the live session and the runnable example",
		"Public coverage, product mentions or leads",
	],
	notes: [
		"Before starting we agree the product areas, who David is acting as, and where the run ends: a first working result, or something closer to production, such as a highly available install, a backup and restore, or an upgrade, as long as it fits in the 10 business days. For products with more than one kind of user, such as a platform team and the application developers they serve, the review covers up to two. An open-source project and its paid or hosted product count as two, so one review can follow a developer from the open-source install to the move to the paid product.",
		"If the review is missing anything the statement of work lists, David finishes it before you are invoiced.",
		"After the review call you have 30 days to decide. Continue to the full 90 days for $7,000 more, or stop and keep everything.",
	],
	mailto: buildMailto("First-run review request", applicationBody),
};

/**
 * Illustrative friction-log rows for a fictional product, so buyers can see
 * the format of the deliverable. Labelled as illustrative on the page.
 */
export const sampleFrictionLog = [
	{
		rank: 1,
		effort: "Medium",
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
		rank: 2,
		effort: "Low",
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
		rank: 4,
		effort: "Low",
		at: "23:30",
		step: "First deployment",
		finding:
			"The deploy succeeds but nothing says how to reach the service. The answer is in a GitHub issue.",
		impact: "Medium",
		action: "Teach",
		recommendation:
			"End the quick start with a port-forward and a curl, then link a guide on ingress.",
	},
	{
		rank: 3,
		effort: "Medium",
		at: "41:05",
		step: "Move to the hosted product",
		finding:
			"Moving from the open-source install to the hosted product means re-entering every setting by hand. No export, and the docs don't mention it.",
		impact: "High",
		action: "Fix",
		recommendation:
			"Add an import command that reads the open-source config, and link it from the upgrade page.",
	},
] as const;

/**
 * Illustrative only: how one finding becomes a number to watch and a day-90
 * check. Uses the fictional product from the sample log.
 */
export const sampleFindingToNumber = {
	finding:
		"Rank 2: the quick start assumes a kubeconfig context called default.",
	number:
		"Share of new installs that complete the quick start, from your own product analytics.",
	target: "Set on the review call, against your current figure.",
	check:
		"At day 90 David re-runs the quick start on the shipped fix, and the read-out reports the share before and after from your data.",
} as const;

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
