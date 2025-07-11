import type { APIRoute } from "astro";
import type { ParticipantInfo } from "livekit-server-sdk";
import { DataPacket_Kind } from "livekit-server-sdk";
import { extractLiveKitAuth } from "@/lib/auth";
import { roomClientService } from "@/lib/livekit";
import { getParticipantRole } from "@/lib/participant";

type Action =
  | "raise_hand_request"
  | "raise_hand_response"
  | "promote"
  | "demote";

const PARTICIPANT_ACTIONS = ["raise_hand_request"] as const;
const DIRECTOR_ACTIONS = ["promote", "demote", "raise_hand_response"] as const;

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const errorResponse = (error: string, status = 400) =>
  jsonResponse({ error }, status);

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Extract auth from LiveKit token
    const auth = await extractLiveKitAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { roomName, action, participantIdentity } = body;

    // Validate required fields
    if (!roomName || !action) {
      return errorResponse("Room name and action are required");
    }

    // Verify the participant has access to this room
    if (auth.room !== roomName) {
      return errorResponse("Forbidden", 403);
    }

    // Check if participantIdentity is required for this action
    if (DIRECTOR_ACTIONS.includes(action) && !participantIdentity) {
      return errorResponse("Invalid request");
    }

    // Check director authorization for protected actions
    const isDirector = locals.user?.roles?.includes("director") || false;
    if (DIRECTOR_ACTIONS.includes(action) && !isDirector) {
      return errorResponse("Forbidden", 403);
    }

    // Determine target identity
    const targetIdentity = PARTICIPANT_ACTIONS.includes(action)
      ? auth.identity
      : participantIdentity;

    // Get participant info
    let participant: ParticipantInfo | undefined;
    if (targetIdentity) {
      participant = await roomClientService.getParticipant(
        roomName,
        targetIdentity,
      );
      if (!participant) {
        return errorResponse("Participant not found", 404);
      }
    }

    // Handle actions
    const handlers: Record<Action, () => Promise<Response>> = {
      raise_hand_request: async () => {
        const { raised } = body;
        if (raised === undefined) {
          return errorResponse("Raised state is required");
        }

        // Check if the participant's role allows them to raise hand
        const participantRole = getParticipantRole(participant);
        if (participantRole === "viewer") {
          return errorResponse("Forbidden", 403);
        }

        // Send data message to directors about the raise hand request
        const message = JSON.stringify({
          type: "raise_hand_request",
          identity: auth.identity,
          name: participant?.name || auth.identity,
          raised,
          timestamp: Date.now(),
        });

        try {
          await roomClientService.sendData(
            roomName,
            new TextEncoder().encode(message),
            DataPacket_Kind.RELIABLE,
            {},
          );
        } catch (error) {
          console.error("Failed to send raise hand data message:", error);
          return errorResponse("Failed to send raise hand request", 500);
        }

        return jsonResponse({ success: true });
      },

      raise_hand_response: async () => {
        // Directors respond to raise hand requests
        const { targetIdentity: target, approved } = body;
        if (!target || approved === undefined) {
          return errorResponse(
            "Target identity and approved state are required",
          );
        }

        const message = JSON.stringify({
          type: "raise_hand_response",
          targetIdentity: target,
          approved,
          timestamp: Date.now(),
        });

        try {
          await roomClientService.sendData(
            roomName,
            new TextEncoder().encode(message),
            DataPacket_Kind.RELIABLE,
            {},
          );
        } catch (error) {
          console.error("Failed to send raise hand response:", error);
          return errorResponse("Failed to send raise hand response", 500);
        }

        return jsonResponse({ success: true });
      },

      promote: async () => {
        // Update role in attributes
        await roomClientService.updateParticipant(
          roomName,
          participantIdentity,
          {
            permission: {
              canPublish: true,
              canSubscribe: true,
              canPublishData: true,
            },
            attributes: {
              ...participant?.attributes,
              role: "participant",
            },
          },
        );

        // Send data message to clear any raised hand state
        const message = JSON.stringify({
          type: "raise_hand_response",
          targetIdentity: participantIdentity,
          approved: true,
          timestamp: Date.now(),
        });

        try {
          await roomClientService.sendData(
            roomName,
            new TextEncoder().encode(message),
            DataPacket_Kind.RELIABLE,
            {},
          );
        } catch (error) {
          console.error("Failed to send promotion notification:", error);
        }

        return jsonResponse({ success: true });
      },

      demote: async () => {
        // Update role in attributes (keep as participant, just remove publish permissions)
        await roomClientService.updateParticipant(
          roomName,
          participantIdentity,
          {
            permission: {
              canPublish: false,
              canSubscribe: true,
              canPublishData: true,
            },
            attributes: {
              ...participant?.attributes,
              role: "participant",
            },
          },
        );

        // Update room metadata to set the demoter as the presenter
        const rooms = await roomClientService.listRooms([roomName]);
        const room = rooms[0];
        if (room) {
          const metadata = room.metadata ? JSON.parse(room.metadata) : {};
          metadata.presenter = auth.identity;
          await roomClientService.updateRoomMetadata(
            roomName,
            JSON.stringify(metadata),
          );
        }

        // Send data message to clear any raised hand state
        const message = JSON.stringify({
          type: "raise_hand_response",
          targetIdentity: participantIdentity,
          approved: false,
          timestamp: Date.now(),
        });

        try {
          await roomClientService.sendData(
            roomName,
            new TextEncoder().encode(message),
            DataPacket_Kind.RELIABLE,
            {},
          );
        } catch (error) {
          console.error("Failed to send demotion notification:", error);
        }

        return jsonResponse({ success: true });
      },
    };

    const handler = handlers[action as Action];
    if (!handler) {
      return errorResponse("Invalid action");
    }

    return await handler();
  } catch (error) {
    console.error("Error in participant management:", error);
    return errorResponse("Failed to manage participant", 500);
  }
};
