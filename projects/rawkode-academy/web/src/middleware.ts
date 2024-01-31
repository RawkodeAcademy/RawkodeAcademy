import { defineMiddleware } from "astro:middleware";
import { sessionManager } from "./lib/kinde";

export const onRequest = defineMiddleware(async ({ cookies, locals }, next) => {
  const session = sessionManager(cookies);

  locals.user = (await session.getSessionItem("user")) as KindeUser;
  locals.acStateKey = await session.getSessionItem("ac-state-key");
  locals.idToken = await session.getSessionItem("id_token");
  locals.accessToken = await session.getSessionItem("access_token");
  locals.refreshToken = await session.getSessionItem("refresh_token");

  return next();
});
