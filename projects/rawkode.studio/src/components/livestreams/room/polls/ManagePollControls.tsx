import { actions } from "astro:actions";
import { useRoomContext } from "@livekit/components-react"; // To get livestreamId (room.name)
import type React from "react";
import { useState } from "react";
import { type Poll, usePolls } from "@/components/livestreams/room/PollContext";
import { Button } from "@/components/shadcn/button";

interface ManagePollControlsProps {
  poll: Poll; // The poll to manage (could be activePoll from context)
  // livestreamId is derived from room context
}

export const ManagePollControls: React.FC<ManagePollControlsProps> = ({
  poll,
}) => {
  const room = useRoomContext();
  const { setActivePoll } = usePolls(); // To update context after action
  const [isLoading, setIsLoading] = useState<"open" | "close" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOpenPoll = async () => {
    if (!room?.name || !poll || poll.status !== "draft") return;
    setError(null);
    setIsLoading("open");
    try {
      const result = await actions.openPoll({
        pollId: poll.id,
        livestreamId: room.name,
      });
      if (result.success && result.poll) {
        // The DataMessageHandler should update the context via LiveKit message,
        // but we can optimistically update here too or rely on the broadcast.
        // setActivePoll(result.poll); // This might cause issues if LiveKit message arrives too
        console.log("Poll opened:", result.poll.id);
      } else {
        setError(result.error || "Failed to open poll.");
      }
    } catch (err) {
      console.error("Error opening poll:", err);
      setError("An unexpected error occurred while opening poll.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleClosePoll = async () => {
    if (!room?.name || !poll || poll.status !== "open") return;
    setError(null);
    setIsLoading("close");
    try {
      const result = await actions.closePoll({
        pollId: poll.id,
        livestreamId: room.name,
      });
      if (result.success && result.poll) {
        // DataMessageHandler will handle the update from LiveKit message
        console.log("Poll closed:", result.poll.id);
      } else {
        setError(result.error || "Failed to close poll.");
      }
    } catch (err) {
      console.error("Error closing poll:", err);
      setError("An unexpected error occurred while closing poll.");
    } finally {
      setIsLoading(null);
    }
  };

  if (!poll) return null;

  return (
    <div className="p-4 border rounded-lg bg-card text-card-foreground space-y-3">
      <h4 className="font-semibold text-md">Manage Poll: "{poll.question}"</h4>
      <p className="text-sm text-muted-foreground">
        Status: <span className="font-medium text-primary">{poll.status}</span>
      </p>

      {poll.status === "draft" && (
        <Button
          onClick={handleOpenPoll}
          disabled={isLoading === "open"}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading === "open" ? "Opening..." : "Open Poll for Voting"}
        </Button>
      )}

      {poll.status === "open" && (
        <Button
          onClick={handleClosePoll}
          disabled={isLoading === "close"}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          {isLoading === "close" ? "Closing..." : "Close Poll"}
        </Button>
      )}

      {poll.status === "closed" && (
        <p className="text-sm text-center">This poll is closed.</p>
        // Results display or a button to show results could go here
      )}

      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
};
