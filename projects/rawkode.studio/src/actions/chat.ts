import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { eq } from "drizzle-orm";
import { database } from "@/lib/database";
import { chatMessagesTable } from "@/schema";

export type ChatMessage = {
  id: number;
  roomId: string;
  participantIdentity: string;
  participantName: string;
  message: string;
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
            createdAt: chatMessagesTable.createdAt,
          })
          .from(chatMessagesTable)
          .where(eq(chatMessagesTable.roomId, input.roomId))
          .orderBy(chatMessagesTable.createdAt); // Order by creation time

        return messages as ChatMessage[];
      } catch (error) {
        console.error("Failed to fetch chat messages:", error);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch chat messages.",
        });
      }
    },
  }),
};
