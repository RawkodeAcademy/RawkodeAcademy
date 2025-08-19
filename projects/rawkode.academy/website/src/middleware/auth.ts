import { defineMiddleware } from "astro:middleware";
import { Zitadel } from "@/lib/zitadel/index.ts";

export const authMiddleware = defineMiddleware((context, next) => {
  if (context.isPrerendered) {
    // The runtime isn't available for pre-rendered pages and we
    // only want this middleware to run for SSR.
    console.debug("Prerendered: skipping auth middleware");
    return next();
  }

  if (context.request.url.endsWith("/api/auth/sign-out")) {
    // Don't run on sign-out page 😂
    console.debug("Sign-out page, skipping auth middleware");
    return next();
  }

  const accessToken = context.cookies.get("accessToken");
  if (!accessToken) {
    console.debug("No access token, skipping middleware");
    return next();
  }

  const idTokenCookie = context.cookies.get("idToken");
  const idToken = idTokenCookie?.value;
  const refreshTokenCookie = context.cookies.get("refreshToken");
  const refreshToken = refreshTokenCookie?.value;

  const zitadel = new Zitadel();

  const user = zitadel.fetchUser(accessToken.value, idToken, refreshToken);

  if (!user) {
    // Couldn't get a user, let's log them out
    console.debug("No user, redirecting to sign-out");
    return context.redirect("/api/auth/sign-out");
  }

  context.locals.user = user;
  return next();
});
