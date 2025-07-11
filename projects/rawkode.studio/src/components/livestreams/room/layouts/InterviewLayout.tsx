import { ParticipantTile } from "@livekit/components-react";
import { EmptyState } from "./EmptyState";
import { ParticipantNameplate } from "./ParticipantNameplate";
import type { LayoutProps } from "./types";

export function InterviewLayout({ cameraTrackReferences }: LayoutProps) {
  const participants = cameraTrackReferences.slice(0, 4);
  const participantCount = participants.length;

  if (participantCount === 0) {
    return <EmptyState />;
  }

  // Optimize grid layout based on participant count
  const getGridClass = () => {
    if (participantCount === 1) {
      return "grid-cols-1";
    }
    if (participantCount === 2) {
      return "grid-cols-1 md:grid-cols-2";
    }
    if (participantCount <= 4) {
      return "grid-cols-1 sm:grid-cols-2";
    }
    return "grid-cols-1 sm:grid-cols-2";
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-950 dark:to-black p-2">
      <div
        className={`grid ${getGridClass()} gap-2 w-full h-full place-items-center`}
      >
        {participants.map((track) => (
          <div
            key={track.publication?.trackSid}
            className="relative w-full aspect-video"
          >
            <div className="absolute inset-0 overflow-hidden shadow-lg ring-1 ring-gray-300/20 hover:ring-gray-400/30 dark:ring-white/5 dark:hover:ring-white/10 bg-gray-900">
              <ParticipantTile
                trackRef={track}
                disableSpeakingIndicator={true}
                className="absolute inset-0 w-full h-full [&_.lk-participant-tile]:rounded-none"
              />
              <ParticipantNameplate trackRef={track} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
