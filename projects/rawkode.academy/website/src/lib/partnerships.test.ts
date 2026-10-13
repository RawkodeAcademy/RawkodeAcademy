import { describe, expect, it } from "vitest";
import {
	formatPartnershipPlacesOpenThisMonth,
	partnershipPlacesOpenThisMonth,
	partnershipPlacesOpenThisMonthLabel,
} from "./partnerships";

describe("partnership monthly availability", () => {
	it.each([
		[0, "No first-run review places open this month"],
		[1, "1 first-run review place open this month"],
		[2, "2 first-run review places open this month"],
	])("formats %i open places", (places, label) => {
		expect(formatPartnershipPlacesOpenThisMonth(places)).toBe(label);
	});

	it("derives the public label from the hand-edited value", () => {
		expect(partnershipPlacesOpenThisMonthLabel).toBe(
			formatPartnershipPlacesOpenThisMonth(partnershipPlacesOpenThisMonth),
		);
	});
});
