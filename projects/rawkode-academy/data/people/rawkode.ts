import { type NewPerson } from ".";

const biography = `
I am Rawkode!
`;

export const person: NewPerson = {
	id: "rawkode",
	name: "David Flanagan",
	biography,
	socialAccounts: {
		blueSky: "rawkode.dev",
		discord: "rawkode",
		linkedin: "rawkode",
		mastodon: "david@rawkode.academy",
		x: "rawkode",
	}
};
