import type { NewShow, NewShowHost } from ".";
import { person as rawkode } from "../people/rawkode";

export const show: NewShow = {
	id: "rawkode-live",
	name: "Rawkode Live",
};

export const showHosts: NewShowHost[] = [
	{
		showId: show.id,
		personId: rawkode.id,
	}
];
