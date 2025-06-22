import { defineAction, z } from "astro:actions";
import { DataPacket_Kind } from "livekit-server-sdk";
import { roomClientService } from "@/lib/livekit";
import { getCurrentUser } from "@/lib/security"; // Assuming this exists for user identity

export const sendEmojiReaction = defineAction({
  input: z.object({
    roomName: z.string(),
    emoji: z.string().min(1), // Ensure emoji is not empty
    // senderParticipantId: z.string(), // We can get this from the user session
  }),
  handler: async ({ roomName, emoji }, context) => {
    const user = await getCurrentUser(context.locals); // Or however user is fetched

    if (!user || !user.identity) {
      // Or use user.sub or a display name if identity is not directly available
      // For now, let's assume a simple "anonymous" if no user, or throw error
      // This depends on whether anonymous users can send reactions
      console.warn(
        "User not authenticated or identity missing, cannot send reaction as specific user.",
      );
      // Potentially, we could allow anonymous reactions without a senderParticipantId,
      // or use a generic ID. For now, let's require an identity.
      // If we want to proceed with a generic ID for unauthenticated users:
      // senderParticipantId = "anonymous";
      // Or throw:
      return { success: false, error: "User not authenticated." };
    }

    const senderParticipantId = user.identity; // Assuming user.identity is the participant identity

    const payload = {
      type: "emoji_reaction",
      emoji: emoji,
      senderParticipantId: senderParticipantId, // Let clients know who sent it
      timestamp: Date.now(),
    };

    const data = new TextEncoder().encode(JSON.stringify(payload));

    try {
      await roomClientService.sendData({
        room: roomName,
        data: data,
        kind: DataPacket_Kind.LOSSY, // LOSSY is fine for ephemeral reactions
        // destinationIdentities: [], // Empty or undefined sends to all
      });
      console.log(
        `[Action] Emoji reaction "${emoji}" sent to room "${roomName}" by "${senderParticipantId}"`,
      );
      return { success: true };
    } catch (error) {
      console.error("Error sending emoji reaction via LiveKit:", error);
      return { success: false, error: "Failed to send reaction." };
    }
  },
});
