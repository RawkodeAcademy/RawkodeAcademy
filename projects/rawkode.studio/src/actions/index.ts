import { roomClientService } from "@/lib/livekit";
import { ActionError, defineAction } from "astro:actions";

export type LiveStream = {
  id: string;
  name: string;
};

export const server = {
  listRooms: defineAction({
    handler: async (_input, context) => {
      if (!context.locals.user) {
        throw new ActionError({ code: "UNAUTHORIZED" });
      }

      const rooms = await roomClientService.listRooms();

      return rooms.map((room) => ({
        id: room.sid,
        name: room.name,
      }));
    },
  }),
};
