import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { eq, and } from "drizzle-orm";
import { database } from "@/lib/database";
import { chatMessagesTable } from "@/schema";
import {
  hasDirectorRole,
  type OidcStandardClaimsWithRoles,
} from "@/lib/security";
import { roomClientService } from "@/lib/livekit";
import { DataPacket_Kind } from "livekit-server-sdk";

export type ChatMessage = {
  id: number;
  roomId: string;
  participantIdentity: string;
  participantName: string;
  message: string;
  isPromoted: boolean;
  createdAt: Date;
};

export const chat = {
  addChatMessage: defineAction({
    input: z.object({
      roomId: z.string(),
      participantIdentity: z.string(),
      participantName: z.string(),
      message: z.string(),
    }),

    handler: async (input) => {
      await database.insert(chatMessagesTable).values({
        roomId: input.roomId,
        participantIdentity: input.participantIdentity,
        participantName: input.participantName,
        message: input.message,
      });
    },
  }),

  getPastRoomChatMessages: defineAction({
    input: z.object({
      roomId: z.string(),
    }),
    handler: async (input) => {
      try {
        const messages = await database
          .select({
            id: chatMessagesTable.id,
            roomId: chatMessagesTable.roomId,
            participantIdentity: chatMessagesTable.participantIdentity,
            participantName: chatMessagesTable.participantName,
            message: chatMessagesTable.message,
            isPromoted: chatMessagesTable.isPromoted,
            createdAt: chatMessagesTable.createdAt,
          })
          .from(chatMessagesTable)
          .where(eq(chatMessagesTable.roomId, input.roomId))
          .orderBy(chatMessagesTable.createdAt); // Order by creation time

        return messages as ChatMessage[];
      } catch (_error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch chat messages.",
        });
      }
    },
  }),

  promoteChatMessage: defineAction({
    input: z.object({
      messageId: z.number(),
    }),
    handler: async (input, context) => {
      // @ts-expect-error - locals is not typed correctly by Astro
      const user = context.locals?.user as OidcStandardClaimsWithRoles | undefined;

      if (!user || !hasDirectorRole(user)) {
        throw new ActionError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to promote messages.",
        });
      }

      try {
        const [updatedMessage] = await database
          .update(chatMessagesTable)
          .set({ isPromoted: true })
          .where(eq(chatMessagesTable.id, input.messageId))
          .returning();

        if (!updatedMessage) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Message not found.",
          });
        }

        // Notify clients via LiveKit data message
        const topic = "chat:promoted"; // Define a topic for promoted messages
        const payload = {
          type: "message_promoted",
          message: updatedMessage,
        };
        const data = new TextEncoder().encode(JSON.stringify(payload));

        await roomClientService.sendData(
          updatedMessage.roomId, // Send to the room where the message originated
          data,
          DataPacket_Kind.RELIABLE,
          { topic }, // Send on a specific topic
        );

        return { success: true, message: updatedMessage };
      } catch (error) {
        console.error("Failed to promote chat message:", error);
        if (error instanceof ActionError) {
          throw error;
        }
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to promote chat message.",
        });
      }
    },
  }),

  getPromotedChatMessages: defineAction({
    input: z.object({
      roomId: z.string(),
    }),
    handler: async (input) => {
      try {
        const messages = await database
          .select({
            id: chatMessagesTable.id,
            roomId: chatMessagesTable.roomId,
            participantIdentity: chatMessagesTable.participantIdentity,
            participantName: chatMessagesTable.participantName,
            message: chatMessagesTable.message,
            isPromoted: chatMessagesTable.isPromoted,
            createdAt: chatMessagesTable.createdAt,
          })
          .from(chatMessagesTable)
          .where(
            and(
              eq(chatMessagesTable.roomId, input.roomId),
              eq(chatMessagesTable.isPromoted, true),
            ),
          )
          .orderBy(chatMessagesTable.createdAt) // Fetches oldest promoted first
          .all();

        return messages as ChatMessage[];
      } catch (_error) {
        console.error("Failed to fetch promoted chat messages:", _error);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch promoted chat messages.",
        });
      }
    },
  }),
};
