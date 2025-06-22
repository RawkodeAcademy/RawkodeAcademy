import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";

export interface EmojiReaction {
  id: string; // Unique ID for the animation key
  emoji: string;
  senderParticipantId: string; // Could be used for display or debugging
  timestamp: number;
}

interface EmojiReactionOverlayProps {
  reactions: EmojiReaction[];
  maxVisibleReactions?: number; // Max reactions to show at once to prevent clutter
  reactionDuration?: number; // How long each reaction stays on screen (ms)
}

const EmojiReactionOverlay: React.FC<EmojiReactionOverlayProps> = ({
  reactions,
  maxVisibleReactions = 10,
  reactionDuration = 3000,
}) => {
  const [visibleReactions, setVisibleReactions] = useState<EmojiReaction[]>([]);

  useEffect(() => {
    // Add new reactions to visibleReactions, ensuring not to exceed maxVisibleReactions
    // More recent reactions might replace older ones if the limit is hit
    // This is a simple approach; more sophisticated queuing could be added
    setVisibleReactions((prevReactions) => {
      const newReactions = reactions.filter(
        (r) =>
          !prevReactions.find((pr) => pr.id === r.id) &&
          Date.now() - r.timestamp < reactionDuration,
      );
      const combined = [...prevReactions, ...newReactions];
      // Sort by timestamp to keep recent ones, then slice
      return combined
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, maxVisibleReactions);
    });

    // Cleanup old reactions
    const timer = setInterval(() => {
      setVisibleReactions((prev) =>
        prev.filter((r) => Date.now() - r.timestamp < reactionDuration),
      );
    }, 1000); // Check every second

    return () => clearInterval(timer);
  }, [reactions, maxVisibleReactions, reactionDuration]);

  if (!visibleReactions.length) {
    return null;
  }

  return (
    <div
      className="absolute bottom-20 right-4 md:right-80 lg:right-96 z-50 pointer-events-none"
      style={
        {
          // Adjust positioning based on where controls/chat are.
          // This assumes chat/participants panel is on the right.
          // If controls are at the bottom, reactions might float upwards from there.
        }
      }
    >
      <AnimatePresence>
        {visibleReactions.map((reaction, index) => (
          <motion.div
            key={reaction.id}
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{
              opacity: [0.5, 1, 1, 0],
              y: [20, -20 * (index % 5) - 20, -20 * (index % 5) - 40], // Spread them out a bit, varied upward motion
              x: [0, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 60], // Slight horizontal drift
              scale: [0.7, 1.2, 1, 0.5],
              rotate: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20],
            }}
            exit={{ opacity: 0, scale: 0.2, transition: { duration: 0.3 } }}
            transition={{ duration: reactionDuration / 1000, ease: "linear" }}
            className="text-4xl md:text-5xl"
            style={{
              position: "absolute",
              bottom: `${(index % 8) * 10}px`, // Stagger start position slightly
              right: `${(index % 3) * 10}px`, // Stagger horizontal start
            }}
          >
            {reaction.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default EmojiReactionOverlay;
