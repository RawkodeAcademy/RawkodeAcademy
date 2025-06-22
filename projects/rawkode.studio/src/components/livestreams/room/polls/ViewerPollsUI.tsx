import type React from "react";
import { usePolls } from "@/components/livestreams/room/PollContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { ActivePollDisplay } from "./ActivePollDisplay";
import { PollResultsDisplay } from "./PollResultsDisplay";

export const ViewerPollsUI: React.FC = () => {
  const { activePoll, latestResults } = usePolls();

  // Priority:
  // 1. If a poll is actively open, show voting UI.
  // 2. If no poll is open, but there are latest results (for the poll that was just active or explicitly shared), show them.
  //    (activePoll might be null or its status might be 'closed')

  if (activePoll && activePoll.status === "open") {
    return <ActivePollDisplay />;
  }

  // Show results if latestResults are available and they correspond to the poll that was just active,
  // or if there's no active poll but results are present.
  if (latestResults && (!activePoll || activePoll.id === latestResults.id)) {
    return (
      <div className="m-4 p-4 fixed bottom-4 left-4 max-w-sm z-50 shadow-lg animate-in fade-in slide-in-from-bottom-10">
        <PollResultsDisplay pollResults={latestResults} />
      </div>
    );
  }

  // If an active poll just closed and results are not yet available in latestResults.
  if (activePoll && activePoll.status === "closed" && (!latestResults || latestResults.id !== activePoll.id)) {
    return (
         <Card className="m-4 p-4 fixed bottom-4 left-4 max-w-sm z-50 shadow-lg animate-in fade-in slide-in-from-bottom-10">
            <CardHeader>
                <CardTitle className="text-md">Poll Closed</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-center text-sm text-muted-foreground">The poll "{activePoll.question}" has ended. Waiting for results...</p>
            </CardContent>
        </Card>>
    );
  }

  return null; // No active poll or relevant results to display
};
