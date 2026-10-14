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
	/** New product reviews David can start in a calendar month. */
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

/** Where the product-review method comes from. */
export const partnershipMethodNote =
	"David has worked through new tools for the first time, live and unscripted, on Rawkode Live since 2020. The product review is the same work done privately, timed and written up as a ranked list.";

/** Who the programme is for. Used in the hero eyebrow and search copy. */
export const partnershipAudience =
	"For developer-tool teams, seed to Series C, building for platform, cloud-native and AI-infrastructure engineers";

export const partnershipDescription =
	"Start with a $5,000 product review from David Flanagan of Rawkode Academy. You get a written list of what to fix first, in order of importance, invoiced on delivery. If it's useful, you can go on to a $12,000 90-day partnership or a $40,000 annual partnership.";

export const partnershipHeroTitle =
	"Find out where developers give up on your product.";

export const partnershipHeroLede =
	"Then decide what to fix, what to explain and what to teach, with David Flanagan, founder of Rawkode Academy.";

export const partnershipStartingPoint =
	"Every partnership starts with a product review. David tells you plainly where engineers get stuck with your product and what to fix first. You get it within 10 business days, and we only invoice once it's delivered. If it's useful, you can go on to a quarterly or annual partnership.";

export const organizationsStartingPoint = partnershipStartingPoint;

/** Example numbers to watch, so buyers can see what "agreed numbers" means. */
export const exampleMeasures =
	"For example: time from sign-up or setup to a first successful deploy, quick-start completion rate, or the share of trials that are still active after a week.";

/** What the partner has in hand at day 90. The page leads with this. */
export const partnershipOutcomes = [
	{
		title: "A product review",
		inReview: true,
		detail:
			"David reviews your product from setup or sign-up to a working result and writes down the places engineers get stuck. Delivered in the first two weeks as part of the review.",
	},
	{
		title: "A written report",
		inReview: true,
		detail:
			"The places engineers get stuck are ranked by how much they cost developers and how hard they are to change, with what to fix first. Your product lead owns the list; David reviews progress with them every month.",
	},
	{
		title: "A live session on Rawkode Academy",
		inReview: false,
		detail:
			"David and your engineer teach one agreed use case live on Rawkode Live, labelled as a partner session. The session stays published on Rawkode Academy and you can reuse it on your own channels.",
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
			"At day 90 David repeats the review on what you've shipped since and checks every place engineers got stuck in the original report: fixed, improved or still there. You get the count before and after, not just an impression.",
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
		"One hour each month with David and the other current partners on what's changing in cloud-native, platform engineering, AI infrastructure and developer tools, and what it means for your roadmap. The call is private, and nothing said is repeated outside it. Until three partners are active, it runs as a one-to-one industry briefing with David.",
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
			"Before one launch a quarter, David reviews the new feature or quick start and sends you the three things most likely to trip developers up. Give us 10 business days' notice. It doesn't mean David will cover the launch publicly.",
	},
	{
		title: "90-day results summary",
		detail:
			"At the end of the 90 days, David sends you a one-page summary of what changed, with before and after numbers, and a five-minute video walking through it. It's written so you can forward it to your CEO or board. If you publish it, it stays marked as prepared under a paid partnership.",
	},
	{
		title: "Cross-partner patterns",
		detail:
			"Each quarter, you get an anonymised write-up of the places engineers got stuck across every partner's review, so you can compare your onboarding with your peers'. No product is named. It starts once three partners are active.",
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
		when: "Weeks 1–2 · product review",
		what: "We start with a kick-off call, and you give us a trial or sandbox account. We agree the numbers to watch, and we set targets on the review call once the findings exist. David carries out the product review and delivers the written report within 10 business days, then walks your team through it in a one-hour call, checking the report against your own funnel numbers.",
	},
	{
		when: "Decide",
		what: "If you sign a quarterly or annual partnership within 30 days of the review being delivered, the $5,000 you paid for it counts towards the cost. You can also stop there. Either way, you keep everything from the review.",
	},
	{
		when: "Month 2",
		what: "Agree the use case to teach. David writes the runnable example, your engineer reviews it, and we run the live session together. Monthly working session on the ranked list.",
	},
	{
		when: "Month 3",
		what: "David repeats the review on what you've shipped and checks each place engineers got stuck. At the day-90 read-out, we compare the results with the targets and decide what to work on next quarter.",
	},
	{
		when: "From month 2",
		what: "Slack Connect with David for questions and second opinions on launches, docs, demos and roadmap trade-offs. Answers within two business days. A monthly all-partner call on what's changing across the industry.",
	},
];

export const partnershipReviewCredit =
	"The $5,000 review counts towards a quarterly or annual partnership when it is signed within 30 days of the review being delivered.";

export const partnershipOffer: PartnershipOffer = {
	id: "partnership-90d",
	name: "Full 90-day partnership",
	label: "Work with Rawkode Academy",
	price: "$12,000",
	priceShort: "$12k/90 days",
	cadence: `This is a fixed price. ${partnershipReviewCredit} In that case, continuing costs $7,000 more, paid as $3,500 a month for two months.`,
	summary:
		"The review, plus the rest of the 90 days: a live session, a runnable example, monthly working sessions with written recaps, Slack with David, the monthly all-partner call, a before-and-after re-run and a day-90 read-out.",
	included: [
		"The product review and written report",
		"One live partner session on Rawkode Live, co-taught with your engineer",
		"One runnable example repository, written by David",
		"Monthly 60-minute working sessions with written recaps",
		"Slack Connect with David.",
		"A monthly all-partner call with David and the other current partners on industry changes",
		"Partners also get extras: David re-tests fixes you ship, does a review before one launch a quarter, sends a 90-day results summary you can share with your board, gives you mentions in the newsletter and on Discord, and makes warm introductions.",
		"A day-90 review compared with the original, and a read-out against the targets set on the review call.",
	],
	excluded: [
		"Building or fixing your product. Your team owns the changes.",
		"We don't promise a number of viewers, leads or positive coverage. The partner session is clearly labelled as a partnership, and you get straight answers.",
		"On-call support, extra sessions and maintaining the example after day 90, unless agreed separately.",
	],
	notes: [],
	mailto: buildMailto("90-day partnership", applicationBody),
};

export const annualPartnershipOffer: PartnershipOffer = {
	id: "partnership-annual",
	name: "Annual partnership",
	label: "Work with Rawkode Academy for a year",
	price: "$40,000 a year",
	priceShort: "$40k/year",
	cadence: "It costs $40,000 a year, billed at $10,000 a quarter.",
	summary:
		"The year starts with the full product review. You also get Slack with David and a place on the monthly all-partner call for the whole year. Your monthly 60-minute working sessions with David run all year too, as they do in the 90-day partnership.",
	included: [],
	excluded: [],
	notes: [partnershipReviewCredit],
	mailto: buildMailto("Annual partnership", applicationBody),
};

export const annualPartnershipDetails = [
	"At each quarterly read-out, you decide what the next quarter covers. It can be a re-run compared with last time, a review before a launch followed by a re-check of your fixes, or a live session on Rawkode Live with a runnable example repository. You tell David your choice at the read-out or within five business days, and he confirms it in writing.",
	"The contract runs for the full year, and either side can choose not to continue after that.",
] as const;

/** Terms buyers, finance and procurement ask about. */
export const partnershipTerms = [
	{
		title: "Stop after the review",
		detail:
			"The review is the first step and is priced on its own. It is invoiced when we deliver it, not before. If you stop there you have paid $5,000 and keep the review and written report. There is nothing to cancel.",
	},
	{
		title: "Renewal",
		detail:
			"Nothing renews automatically. A quarterly partnership ends after 90 days, and an annual partnership ends after a year, with a review each quarter. If you want to carry on, we agree it in writing.",
	},
	{
		title: "Invoicing",
		detail: `The review is invoiced on delivery. ${partnershipReviewCredit} For the quarterly partnership, the remaining $7,000 is invoiced as two monthly payments of $3,500. The annual partnership is billed at $10,000 a quarter. All prices are fixed and in USD, with 30-day payment terms, and exclude VAT where it applies.`,
	},
	{
		title: "Paperwork",
		detail:
			"A one-page statement of work listing the deliverables, dates and targets, before you sign. It names the contracting entity and the liability cap. We can work under your MSA and sign your NDA.",
	},
	{
		title: "Access and data",
		detail:
			"We work from a trial or sandbox account and don't need production systems or customer data. Review materials are shared with you privately and we delete our copies 90 days after the work ends, or sooner if you ask. Slack Connect is a shared channel your admins control and can close at any time.",
	},
	{
		title: "If David can't make it",
		detail:
			"David does the work himself. If he can't deliver a scheduled item, we move the date with your agreement.",
	},
	{
		title: "Ownership",
		detail:
			"You own the review, the report and the read-out. The example repository is licensed Apache 2.0, so you can use, change and ship it. You approve the session title and use case, can reuse the published session on your own channels, and can ask us to unlist it.",
	},
] as const;

/** First step of every partnership, independently useful. */
export const fitProofReview: PartnershipOffer = {
	id: "product-review",
	name: "Product review",
	label: "Step one",
	price: "$5,000",
	priceShort: "$5k",
	cadence:
		"A fixed price, delivered within 10 business days of getting access.",
	summary:
		"The first step of every partnership, and useful on its own: David's product review and a written report you can act on whether or not you continue.",
	included: [
		"A written report showing the places engineers get stuck",
		"A ranked list of what to fix first",
		"Two or three numbers to watch, with a target for each",
		"A one-hour call to go through it with your team",
	],
	excluded: [
		"Ongoing Slack access, the all-partner call, the live session and the runnable example",
		"Public coverage, product mentions or leads",
	],
	notes: [
		"Before starting we agree the product areas, who David is acting as, and where the review ends: a first working result, or something closer to production, such as a highly available setup, a backup and restore, or an upgrade, as long as it fits in the 10 business days. For products with more than one kind of user, such as a platform team and the application developers they serve, the review covers up to two. An open-source project and its paid or hosted product count as two, so one review can follow a developer from the open-source setup to the move to the paid product.",
		"If the review is missing anything the statement of work lists, David finishes it before you are invoiced.",
		`${partnershipReviewCredit} You can then continue to the quarterly partnership for $7,000 more, choose the annual partnership, or stop and keep everything.`,
	],
	mailto: buildMailto("Product review request", applicationBody),
};

/** Compatibility shape for components that render the partnership offers. */
export const partnershipTiers = [
	partnershipOffer,
	annualPartnershipOffer,
] as const;
export const partnershipTierNames = partnershipTiers.map((offer) => offer.name);

/** Options for the application form's preferred route field. */
export const applicationPaths = [
	"Product review",
	"90-day partnership",
	"Annual plan",
	"Not sure yet",
] as const;
export type ApplicationPath = (typeof applicationPaths)[number];

export const productReviewPath = "Product review" satisfies ApplicationPath;

/** Plain labels for form values and preselection links. */
export const applicationPathLabels: Record<ApplicationPath, string> = {
	"Product review": fitProofReview.name,
	"90-day partnership": partnershipOffer.name,
	"Annual plan": annualPartnershipOffer.name,
	"Not sure yet": "Not sure yet",
};

/** Attio Offer option title and USD value for each application route. */
export const applicationPathDeals: Record<
	ApplicationPath,
	{ offer: string; valueUsd: number }
> = {
	"Product review": { offer: "Review", valueUsd: 5000 },
	"Not sure yet": { offer: "Review", valueUsd: 5000 },
	"90-day partnership": {
		offer: "Partnership (Quarterly)",
		valueUsd: 12000,
	},
	"Annual plan": { offer: "Partnership (Yearly)", valueUsd: 40000 },
};

/**
 * Route values from earlier links that still preselect the right option.
 * "First-run review" and "Fit & Proof Review" both meant the paid review.
 */
export const legacyApplicationPaths: Record<string, ApplicationPath> = {
	"Adoption Advisory": "90-day partnership",
	"Annual partnership": "Annual plan",
	"First-run review": "Product review",
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
