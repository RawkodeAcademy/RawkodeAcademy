import { useEffect, useState } from "react";
import { useDataChannel, useRoomContext } from "@livekit/components-react";
import { actions } from "astro:actions";
import type { ChatMessage as APIChatMessage } from "@/actions/chat";
import { ShieldCheck } from "lucide-react"; // Using a different icon for promoted message

interface PromotedMessagesDisplayProps {
  // Potentially add props for styling or behavior customization later
}

export function PromotedMessagesDisplay({}: PromotedMessagesDisplayProps) {
  const [promotedMessage, setPromotedMessage] = useState<APIChatMessage | null>(
    null,
  );
  const [isVisible, setIsVisible] = useState(false);
  const room = useRoomContext();

  // Fetch initial promoted messages
  useEffect(() => {
    const fetchInitialPromoted = async () => {
      if (!room.name) return;
      try {
        const result = await actions.chat.getPromotedChatMessages({
          roomId: room.name,
        });
        if (result.error) {
          console.error(
            "Failed to fetch initial promoted messages:",
            result.error.message,
          );
          return;
        }
        if (result.data && result.data.length > 0) {
          // Display the latest promoted message by createdAt timestamp
          const latestMessage = result.data.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )[0];
          setPromotedMessage(latestMessage);
          setIsVisible(true);
        }
      } catch (e) {
        console.error("Error calling getPromotedChatMessages:", e);
      }
    };

    fetchInitialPromoted();
  }, [room.name]);

  // Listen for LiveKit data messages for real-time updates
  useDataChannel("chat:promoted", (message) => {
    try {
      const decoder = new TextDecoder();
      const receivedData = JSON.parse(decoder.decode(message.payload));

      if (receivedData.type === "message_promoted" && receivedData.message) {
        setPromotedMessage(receivedData.message as APIChatMessage);
        setIsVisible(true);

        // Optional: Auto-hide message after a few seconds
        // setTimeout(() => setIsVisible(false), 10000); // Hide after 10 seconds
      }
      // Could handle "message_demoted" or other types here in the future
    } catch (e) {
      console.error("Error processing data channel message:", e);
    }
  });

  useEffect(() => {
    if (promotedMessage) {
      setIsVisible(true);
      // Optional: Auto-hide message after a few seconds
      const timer = setTimeout(() => setIsVisible(false), 10000); // Hide after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [promotedMessage]);

  if (!isVisible || !promotedMessage) {
    return null;
  }

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-background/80 backdrop-blur-md border border-primary/50 rounded-lg shadow-xl text-foreground transition-all duration-500 ease-in-out animate-slideInUp"
      style={{
        animationName: isVisible ? "slideInUp" : "slideOutDown",
        animationDuration: "0.5s",
        animationFillMode: "forwards",
      }}
    >
      <div className="flex items-center mb-2">
        <ShieldCheck className="h-6 w-6 text-primary mr-2 flex-shrink-0" />
        <p className="text-sm font-semibold text-primary truncate">
          {promotedMessage.participantName}
        </p>
      </div>
      <p className="text-base break-words">{promotedMessage.message}</p>
      <style>{`
        @keyframes slideInUp {
          from {
            transform: translate(-50%, 100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
        @keyframes slideOutDown {
          from {
            transform: translate(-50%, 0);
            opacity: 1;
          }
          to {
            transform: translate(-50%, 100%);
            opacity: 0;
          }
        }
        .animate-slideInUp {
          animation-name: slideInUp;
        }
      `}</style>
    </div>
  );
}
