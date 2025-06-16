import { signupForCommunityDay } from "./community-day";
import { signupForKlustered } from "./klustered";
import { trackShareEvent } from "./share";
import { trackVideoEvent } from "./video";

export const server = {
  trackVideoEvent,
  signupForCommunityDay,
  signupForKlustered,
  trackShareEvent,
};
