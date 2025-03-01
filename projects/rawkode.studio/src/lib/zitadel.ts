import { decodeJWT } from "@oslojs/jwt";
import type { OAuth2Tokens } from "arctic";
import { createS256CodeChallenge } from "arctic/dist/oauth2";
import { createOAuth2Request, sendTokenRequest } from "arctic/dist/request";
import { ZITADEL_CLIENT_ID, ZITADEL_URL } from "astro:env/server";
import type { OidcStandardClaimsWithRoles, Roles } from "./security";

type ZitadelRoles = { [role: string]: { [aud: string]: string } };

export class Zitadel {
  private readonly baseUrl = ZITADEL_URL;
  private readonly clientId = ZITADEL_CLIENT_ID;

  public readonly jwksUrl = `${this.baseUrl}/oauth/v2/keys`;

  private readonly authorizationEndpoint = `${this.baseUrl}/oauth/v2/authorize`;
  private readonly redirectUri = `${import.meta.env.SITE}/api/auth/callback`;
  private readonly tokenEndpoint = `${this.baseUrl}/oauth/v2/token`;

  private readonly scopes = [
    "openid",
    "email",
    "profile",
    "urn:zitadel:iam:org:project:id:zitadel:aud",
    "urn:zitadel:iam:org:projects:roles",
  ];

  public createAuthorizationURL(
    state: string,
    codeVerifier: string,
  ): URL {
    const url = new URL(this.authorizationEndpoint);

    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("state", state);
    url.searchParams.set("scope", this.scopes.join(" "));

    const codeChallenge = createS256CodeChallenge(codeVerifier);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("redirect_uri", this.redirectUri);

    return url;
  }

  public async validateAuthorizationCode(
    code: string,
    codeVerifier: string,
  ): Promise<OAuth2Tokens> {
    const searchParams = new URLSearchParams();
    searchParams.set("grant_type", "authorization_code");
    searchParams.set("code", code);
    searchParams.set("code_verifier", codeVerifier);
    searchParams.set("redirect_uri", this.redirectUri);
    searchParams.set("client_id", this.clientId);
    searchParams.set(
      "scope",
      this.scopes.join(" "),
    );

    const request = createOAuth2Request(this.tokenEndpoint, searchParams);
    const tokens = await sendTokenRequest(request);

    return tokens;
  }

  public async fetchUser(
    idToken: string | undefined,
  ): Promise<OidcStandardClaimsWithRoles | undefined> {
    if (!idToken) {
      return undefined;
    }

    try {
      const decodedIdToken = decodeJWT(idToken);

      if ("urn:zitadel:iam:org:project:roles" in decodedIdToken) {
        const roles =
          decodedIdToken["urn:zitadel:iam:org:project:roles"] as ZitadelRoles;

        return {
          ...decodedIdToken,
          roles: Object.keys(roles).map((role) => role as Roles),
        };
      }

      return undefined;
    } catch (e) {
      console.error(e);
    }

    // TODO: Eventually add refresh logic
    return undefined;
  }
}
