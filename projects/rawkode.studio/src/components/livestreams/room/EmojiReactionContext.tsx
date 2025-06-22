import type React from "react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid"; // For unique keys for animations

export interface RawEmojiReaction {
  emoji: string;
  senderParticipantId: string;
  timestamp: number;
}

export interface EmojiReaction extends RawEmojiReaction {
  id: string; // Unique ID for the animation key
}

interface EmojiReactionContextType {
  reactions: EmojiReaction[];
  addReaction: (reactionData: RawEmojiReaction) => void;
  reactionsVisible: boolean;
  toggleReactionsVisibility: () => void;
}

const EmojiReactionContext = createContext<
  EmojiReactionContextType | undefined
>(undefined);

export const EmojiReactionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [reactionsVisible, setReactionsVisible] = useState(true); // Default to visible
  const reactionDisplayLimit = 20;

  const toggleReactionsVisibility = useCallback(() => {
    setReactionsVisible((prev) => !prev);
  }, []);

  const addReaction = useCallback((reactionData: RawEmojiReaction) => {
    const newReaction: EmojiReaction = {
      ...reactionData,
      id: uuidv4(), // Generate a unique ID for this specific display instance
    };
    setReactions((prevReactions) => {
      const updatedReactions = [...prevReactions, newReaction];
      // Keep the list from growing indefinitely, similar to what overlay does, but more for state management
      if (updatedReactions.length > reactionDisplayLimit + 10) {
        // keep a bit more than display limit
        return updatedReactions.slice(
          updatedReactions.length - reactionDisplayLimit,
        );
      }
      return updatedReactions;
    });
  }, []);

  // Optional: Implement cleanup of very old reactions from the main state if necessary,
  // though EmojiReactionOverlay also has its own display timeout.
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setReactions(prev => prev.filter(r => Date.now() - r.timestamp < 10000)); // Remove reactions older than 10s from state
  //   }, 5000);
  //   return () => clearInterval(timer);
  // }, []);

  return (
    <EmojiReactionContext.Provider
      value={{
        reactions,
        addReaction,
        reactionsVisible,
        toggleReactionsVisibility,
      }}
    >
      {children}
    </EmojiReactionContext.Provider>
  );
};

export const useEmojiReactions = (): EmojiReactionContextType => {
  const context = useContext(EmojiReactionContext);
  if (!context) {
    throw new Error(
      "useEmojiReactions must be used within an EmojiReactionProvider",
    );
  }
  return context;
};
