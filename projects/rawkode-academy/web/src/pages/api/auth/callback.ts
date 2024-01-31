import type { APIRoute } from "astro";
import {kindeClient, sessionManager} from "../../../lib/kinde";

export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  await kindeClient.handleRedirectToApp(sessionManager(cookies), url);

  return redirect("/", 302);
};
