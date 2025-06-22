import { actions } from "astro:actions"; // Import server actions
import { useRoomContext } from "@livekit/components-react";
import { Smile } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";

const defaultEmojis = ["👍", "❤️", "😂", "😮", "🎉", "🤔", "🙏", "🔥"];

type EmojiControlsProps = {};

export const EmojiControls: React.FC<EmojiControlsProps> = () => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const room = useRoomContext(); // To get the roomName

  const handleEmojiSelect = async (emoji: string) => {
    if (!room?.name) {
      console.error("Room name not available to send emoji reaction.");
      // Potentially show a user-facing error
      return;
    }

    setPopoverOpen(false); // Close popover on selection

    try {
      const result = await actions.sendEmojiReaction({
        roomName: room.name,
        emoji: emoji,
      });
      if (!result.success) {
        console.error("Failed to send emoji reaction:", result.error);
        // Optionally, show a small error toast to the user
      }
    } catch (error) {
      console.error("Error calling sendEmojiReaction action:", error);
      // Optionally, show a small error toast to the user
    }
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Send reaction">
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 bg-background border rounded-lg shadow-xl">
        <div className="grid grid-cols-4 gap-2">
          {defaultEmojis.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="icon"
              className="text-2xl hover:bg-muted rounded-md p-2"
              onClick={() => handleEmojiSelect(emoji)}
              aria-label={`Send ${emoji} reaction`}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
