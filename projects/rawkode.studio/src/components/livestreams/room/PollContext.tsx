import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import type React from "react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Interfaces matching backend and LiveKit payload structures
export interface PollOption extends string {} // For clarity, though it's just string

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  status: "draft" | "open" | "closed";
  openedAt?: string; // ISO string
  closedAt?: string; // ISO string
  // livestreamId is not needed on client if context is per-room
}

export interface PollResults {
  [option: string]: number;
}

export interface FullPollResults extends Poll {
  results: PollResults;
  totalVotes: number;
}

interface PollContextType {
  activePoll: Poll | null;
  setActivePoll: (poll: Poll | null) => void; // Director might set this when creating/opening
  latestResults: FullPollResults | null;
  setLatestResults: (results: FullPollResults | null) => void; // Store results when fetched/broadcast
  clearPollState: () => void;
}

const PollContext = createContext<PollContextType | undefined>(undefined);

export const PollProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [latestResults, setLatestResults] = useState<FullPollResults | null>(
    null,
  );
  const room = useRoomContext();

  const clearPollState = useCallback(() => {
    setActivePoll(null);
    setLatestResults(null);
  }, []);

  // Listen for poll messages from LiveKit data channel (handled in LiveKitRoom.tsx's DataMessageHandler)
  // This context will be updated by calls from there, or components can directly call setActivePoll/setLatestResults
  // For example, DataMessageHandler would call:
  // const { setActivePoll, setLatestResults } = usePolls();
  // if (message.type === "poll_open") setActivePoll(message.poll);
  // if (message.type === "poll_closed") { setActivePoll(null); /* Optionally fetch/display results */ }
  // if (message.type === "poll_results") setLatestResults(message.data); // If results are broadcast

  // Clear poll state if room disconnects
  useEffect(() => {
    if (!room) return;
    const handleDisconnect = () => {
      clearPollState();
    };
    room.on(RoomEvent.Disconnected, handleDisconnect);
    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnect);
    };
  }, [room, clearPollState]);

  return (
    <PollContext.Provider
      value={{
        activePoll,
        setActivePoll,
        latestResults,
        setLatestResults,
        clearPollState,
      }}
    >
      {children}
    </PollContext.Provider>
  );
};

export const usePolls = (): PollContextType => {
  const context = useContext(PollContext);
  if (!context) {
    throw new Error("usePolls must be used within a PollProvider");
  }
  return context;
};
