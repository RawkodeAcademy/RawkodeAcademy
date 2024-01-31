import {
	GrantType,
	createKindeServerClient,
	type SessionManager,
} from "@kinde-oss/kinde-typescript-sdk";
import type { AstroCookies } from "astro";

export const kindeClient = createKindeServerClient(GrantType.PKCE, {
	authDomain: "https://account.rawkode.academy",
	clientId: "e094bb1af09941d6a689a42f8bf1e5d1",
	logoutRedirectURL: "http://localhost:4321",
	redirectURL: "http://localhost:4321/api/auth/callback",
});

export const sessionManager = (cookieStore: AstroCookies) =>
	({
		getSessionItem: (itemKey: string) => {
			const item = cookieStore.get(itemKey);

			console.log("GET");
			console.log({ itemKey, item });
			if (item) {
				if (typeof item === "object") {
					return item.value;
				}

				try {
					console.log("parse attempt");
					const jsonValue = JSON.parse(item.value);
					if (typeof jsonValue === "object") {
						return jsonValue;
					}
					return item.value;
				} catch (error) {
					console.log("falling back");
					return item.value;
				}
			}
			return null;
		},

		setSessionItem: (itemKey: string, itemValue: any) => {
			console.log("SET");
			console.log({ itemKey, itemValue });

			if (itemValue !== undefined) {
				cookieStore.set(
					itemKey,
					typeof itemValue === "object" ? JSON.stringify(itemValue) : itemValue,
					{ path: "/" },
				);
			}
		},

		removeSessionItem: (itemKey: string) => {
			cookieStore.delete(itemKey);
		},

		destroySession: () => {
			[
				"ac-state-key",
				"id_token_payload",
				"id_token",
				"access_token_payload",
				"access_token",
				"user",
				"refresh_token",
			].forEach((name) => cookieStore.delete(name, { path: "/" }));
		},
	}) as SessionManager;
