import { defineAction, z } from "astro:actions";
import { eq } from "drizzle-orm";
import { DataPacket_Kind } from "livekit-server-sdk";
import { db } from "@/lib/database";
import { roomClientService } from "@/lib/livekit";
import { getCurrentUser, hasDirectorRole } from "@/lib/security"; // Assuming director role check
import { pollsTable } from "@/schema";

// Zod schema for poll options (array of strings)
const pollOptionsSchema = z
  .array(z.string().min(1))
  .min(2, "At least two options are required.");

export const createPoll = defineAction({
  input: z.object({
    livestreamId: z.string(),
    question: z.string().min(3, "Question must be at least 3 characters long."),
    options: pollOptionsSchema,
  }),
  handler: async ({ livestreamId, question, options }, context) => {
    const user = await getCurrentUser(context.locals);
    if (!user || !hasDirectorRole(user)) {
      return {
        success: false,
        error: "Unauthorized: Only directors can create polls.",
      };
    }

    try {
      const newPollId = crypto.randomUUID();
      await db.insert(pollsTable).values({
        id: newPollId,
        livestreamId,
        question,
        options: JSON.stringify(options), // Store options as JSON string
        status: "draft", // Polls are created as drafts first
        // createdAt is handled by $defaultFn
      });

      console.log(
        `[Action] Poll created (draft): "${question}" for livestream "${livestreamId}" by "${user.identity}"`,
      );
      return { success: true, pollId: newPollId, status: "draft" };
    } catch (error) {
      console.error("Error creating poll:", error);
      return { success: false, error: "Failed to create poll." };
    }
  },
});

export const openPoll = defineAction({
  input: z.object({
    pollId: z.string(),
    livestreamId: z.string(), // For sending LiveKit message
  }),
  handler: async ({ pollId, livestreamId }, context) => {
    const user = await getCurrentUser(context.locals);
    if (!user || !hasDirectorRole(user)) {
      return {
        success: false,
        error: "Unauthorized: Only directors can open polls.",
      };
    }

    try {
      const poll = await db.query.pollsTable.findFirst({
        where: eq(pollsTable.id, pollId),
      });
      if (!poll) {
        return { success: false, error: "Poll not found." };
      }
      if (poll.status !== "draft") {
        return { success: false, error: `Poll is already ${poll.status}.` };
      }

      const updatedPoll = await db
        .update(pollsTable)
        .set({ status: "open", openedAt: new Date() })
        .where(eq(pollsTable.id, pollId))
        .returning()
        .get(); // .get() for SQLite to get the updated row.

      if (!updatedPoll) {
        return { success: false, error: "Failed to update poll status." };
      }

      // Broadcast poll opening via LiveKit data channel
      const payload = {
        type: "poll_open",
        poll: {
          id: updatedPoll.id,
          question: updatedPoll.question,
          options: JSON.parse(updatedPoll.options as string), // Parse options string back to array
          status: updatedPoll.status,
          openedAt: updatedPoll.openedAt?.toISOString(),
        },
      };
      const data = new TextEncoder().encode(JSON.stringify(payload));
      await roomClientService.sendData({
        room: livestreamId, // Need room name (livestreamId is the room name/id here)
        data: data,
        kind: DataPacket_Kind.RELIABLE, // Polls should be reliable
      });

      console.log(
        `[Action] Poll opened: "${updatedPoll.question}" (ID: ${pollId}) by "${user.identity}"`,
      );
      return { success: true, poll: updatedPoll };
    } catch (error) {
      console.error("Error opening poll:", error);
      return { success: false, error: "Failed to open poll." };
    }
  },
});

export const submitPollResponse = defineAction({
  input: z.object({
    pollId: z.string(),
    selectedOption: z.string(), // Assuming option is identified by its text content
    // livestreamId: z.string(), // For potential LiveKit broadcast of vote counts - currently unused
  }),
  handler: async ({ pollId, selectedOption /*, livestreamId */ }, context) => {
    const user = await getCurrentUser(context.locals);
    if (!user || !user.identity) {
      return { success: false, error: "User not authenticated." };
    }

    try {
      // Check if poll is open
      const poll = await db.query.pollsTable.findFirst({
        where: eq(pollsTable.id, pollId),
      });
      if (!poll) {
        return { success: false, error: "Poll not found." };
      }
      if (poll.status !== "open") {
        return { success: false, error: "Poll is not open for responses." };
      }

      // Validate selectedOption against poll.options
      const options = JSON.parse(poll.options as string) as string[];
      if (!options.includes(selectedOption)) {
        return { success: false, error: "Invalid option selected." };
      }

      // Store the response (Drizzle handles potential duplicate submissions if unique constraints are added,
      // for now, we allow multiple responses from same user, or client should prevent it)
      // To prevent multiple votes, a unique constraint on (pollId, participantIdentity) would be needed in schema.
      // For simplicity, this is omitted for now.
      await db.insert(pollResponsesTable).values({
        pollId,
        participantIdentity: user.identity,
        selectedOption,
        // createdAt is handled by $defaultFn
      });

      console.log(
        `[Action] Poll response submitted for poll "${pollId}" by "${user.identity}": "${selectedOption}"`,
      );

      // Optional: Broadcast vote counts or an update message
      // This could be a simple "new_vote" message or aggregated counts.
      // For now, let's skip broadcasting individual votes to avoid too much traffic.
      // Results will be fetched explicitly or broadcasted upon closing.

      return { success: true };
    } catch (error) {
      console.error("Error submitting poll response:", error);
      return { success: false, error: "Failed to submit response." };
    }
  },
});

export const closePoll = defineAction({
  input: z.object({
    pollId: z.string(),
    livestreamId: z.string(), // For sending LiveKit message
  }),
  handler: async ({ pollId, livestreamId }, context) => {
    const user = await getCurrentUser(context.locals);
    if (!user || !hasDirectorRole(user)) {
      return {
        success: false,
        error: "Unauthorized: Only directors can close polls.",
      };
    }

    try {
      const poll = await db.query.pollsTable.findFirst({
        where: eq(pollsTable.id, pollId),
      });
      if (!poll) {
        return { success: false, error: "Poll not found." };
      }
      if (poll.status !== "open") {
        return {
          success: false,
          error: `Poll is not open, cannot close. Current status: ${poll.status}`,
        };
      }

      const updatedPoll = await db
        .update(pollsTable)
        .set({ status: "closed", closedAt: new Date() })
        .where(eq(pollsTable.id, pollId))
        .returning()
        .get();

      if (!updatedPoll) {
        return {
          success: false,
          error: "Failed to update poll status to closed.",
        };
      }

      // Broadcast poll closing via LiveKit data channel
      const payload = {
        type: "poll_closed",
        pollId: updatedPoll.id,
        status: updatedPoll.status,
        closedAt: updatedPoll.closedAt?.toISOString(),
      };
      const data = new TextEncoder().encode(JSON.stringify(payload));
      await roomClientService.sendData({
        room: livestreamId,
        data: data,
        kind: DataPacket_Kind.RELIABLE,
      });

      console.log(
        `[Action] Poll closed: "${updatedPoll.question}" (ID: ${pollId}) by "${user.identity}"`,
      );
      // Optionally, immediately broadcast results upon closing
      // const resultsAction = await getPollResults.handler({ pollId }, context);

      return {
        success: true,
        poll: updatedPoll /*, results: resultsAction?.results */,
      };
    } catch (error) {
      console.error("Error closing poll:", error);
      return { success: false, error: "Failed to close poll." };
    }
  },
});

export const getPollResults = defineAction({
  input: z.object({
    pollId: z.string(),
  }),
  handler: async ({ pollId }, context) => {
    // Access to results might be director-only while poll is open, public after close.
    // For now, let's allow any authenticated user to fetch results if the poll is closed.
    // Or always director. Let's start with director-only for simplicity.
    const user = await getCurrentUser(context.locals);
    if (!user || !hasDirectorRole(user)) {
      // Or more granular permission check
      // A viewer might be able to get results if poll is closed.
      // const pollToCheck = await db.query.pollsTable.findFirst({ where: eq(pollsTable.id, pollId) });
      // if (!pollToCheck || pollToCheck.status !== "closed") {
      return { success: false, error: "Unauthorized or poll not closed." };
      // }
    }

    try {
      const poll = await db.query.pollsTable.findFirst({
        where: eq(pollsTable.id, pollId),
      });

      if (!poll) {
        return { success: false, error: "Poll not found." };
      }
      // Optionally restrict if poll is not closed for non-directors
      // if (poll.status !== "closed" && (user && !hasDirectorRole(user))) {
      //   return { success: false, error: "Poll results are not yet available." };
      // }

      const responses = await db.query.pollResponsesTable.findMany({
        where: eq(pollResponsesTable.pollId, pollId),
        columns: {
          selectedOption: true,
        },
      });

      const results: Record<string, number> = {};
      const pollOptions = JSON.parse(poll.options as string) as string[];
      for (const option of pollOptions) {
        results[option] = 0; // Initialize all options with 0 votes
      }

      for (const response of responses) {
        if (results[response.selectedOption] !== undefined) {
          results[response.selectedOption]++;
        }
      }

      const totalVotes = responses.length;

      console.log(
        `[Action] Poll results fetched for poll "${pollId}" by "${user?.identity || "unknown"}"`,
      );
      return {
        success: true,
        pollId,
        results,
        totalVotes,
        question: poll.question,
        options: pollOptions,
      };
    } catch (error) {
      console.error("Error getting poll results:", error);
      return { success: false, error: "Failed to get poll results." };
    }
  },
});
