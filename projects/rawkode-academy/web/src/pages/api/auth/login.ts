import type { APIRoute } from "astro";
import {kindeClient, sessionManager} from "../../../lib/kinde";

export const GET: APIRoute = async ({ redirect, cookies }) => {
  try {
    const loginURL = await kindeClient.login(sessionManager(cookies));
    return redirect(loginURL.toString());
  } catch (e) {
    console.log(e);
    throw new Error("Errorrrrr");
  }
};
