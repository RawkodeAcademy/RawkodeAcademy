/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type KindeUser = {
  family_name: string;
  given_name: string;
  picture: string;
  email: string;
  id: string;
};

declare namespace App {
  interface Locals extends NetlifyLocals {
    user: KindeUser;
    acStateKey: unknown;
    idToken: unknown;
    accessToken: unknown;
    refreshToken: unknown;
  }
}

interface ImportMetaEnv {
  readonly KINDE_CLIENT_ID: string;
  readonly KINDE_CLIENT_SECRET: string;
  readonly KINDE_ISSUER_URL: string;
  readonly KINDE_POST_LOGOUT_REDIRECT_URL: string;
  readonly KINDE_REDIRECT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
