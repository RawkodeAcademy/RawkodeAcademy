import { actions } from "astro:actions"; // To call getPollResults
import { Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
  FullPollResults,
  type Poll,
  usePolls,
} from "@/components/livestreams/room/PollContext";
import { Button } from "@/components/shadcn/button";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { CreatePollForm } from "./CreatePollForm";
import { ManagePollControls } from "./ManagePollControls";
import { PollResultsDisplay } from "./PollResultsDisplay";

// This component will be shown in the sidebar for directors
export const PollsManagementTab: React.FC = () => {
  const { activePoll, setActivePoll, latestResults, setLatestResults } =
    usePolls();
  const [selectedPollForManagement, setSelectedPollForManagement] =
    useState<Poll | null>(null);
  const [view, setView] = useState<"list" | "create" | "manage" | "results">(
    "list",
  );
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // In a real app, directors might have a list of draft/past polls.
  // For now, we primarily manage the 'activePoll' from context or a selected one.
  // This effect syncs the local selectedPollForManagement with the context's activePoll
  // if it's relevant (draft or open).
  useEffect(() => {
    if (
      activePoll &&
      (activePoll.status === "draft" || activePoll.status === "open")
    ) {
      setSelectedPollForManagement(activePoll);
      if (view !== "results") setView("manage"); // If a poll becomes active, switch to manage view
    } else if (!activePoll && view === "manage") {
      // If active poll is cleared (e.g. closed and not immediately showing results)
      // go back to list or await results.
      // If latestResults is available, we might want to show that.
    }
  }, [activePoll, view]);

  const handlePollCreated = (pollId: string) => {
    // After creating, we might want to fetch this poll and set it for management
    // For now, actions.createPoll returns the ID. The director can then choose to open it.
    // A more advanced UI might list draft polls.
    // Let's assume for now the director creates then immediately wants to manage/open it.
    // This requires fetching the newly created poll to get its full data.
    // Or, the createPoll action could return the full poll object.
    // As a simple flow: after creation, they can find it (if listed) or we can auto-select.
    // For now, let's go back to the "list" (which is currently a placeholder).
    setView("list");
    // To make it immediately manageable, we'd need to fetch its details
    // and set `setSelectedPollForManagement`.
    // For simplicity, user can create, then if it becomes 'activePoll' (draft from context), it appears.
  };

  const handleShowResults = async (pollId: string) => {
    setIsLoadingResults(true);
    setLatestResults(null); // Clear previous results
    try {
      const result = await actions.getPollResults({ pollId });
      if (result.success && result.results) {
        setLatestResults({
          id: result.pollId,
          question: result.question || "",
          options: result.options || [],
          status: "closed", // Assuming results are typically for closed polls
          results: result.results,
          totalVotes: result.totalVotes || 0,
        });
        setView("results");
      } else {
        console.error("Failed to fetch poll results:", result.error);
        // Show error to user
      }
    } catch (error) {
      console.error("Error fetching poll results:", error);
    } finally {
      setIsLoadingResults(false);
    }
  };

  const currentPollToManage = selectedPollForManagement || activePoll;

  return (
    <ScrollArea className="h-full p-3">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
          >
            View Active/Manage
          </Button>
          <Button
            variant={view === "create" ? "default" : "outline"}
            onClick={() => setView("create")}
          >
            Create New
          </Button>
        </div>

        {view === "create" && (
          <CreatePollForm onPollCreated={handlePollCreated} />
        )}

        {view === "list" && (
          <div>
            {currentPollToManage &&
            (currentPollToManage.status === "draft" ||
              currentPollToManage.status === "open") ? (
              <ManagePollControls poll={currentPollToManage} />
            ) : (
              <p className="text-muted-foreground">
                No poll currently active or in draft for management. Create a
                new poll or open a draft poll.
              </p>
            )}
            {/* Placeholder for listing draft/closed polls to manage or view results */}
            {activePoll && activePoll.status === "closed" && !latestResults && (
              <Button
                onClick={() => handleShowResults(activePoll.id)}
                disabled={isLoadingResults}
                className="mt-2"
              >
                {isLoadingResults ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : null}
                View Results for Last Poll
              </Button>
            )}
          </div>
        )}

        {/* This explicit manage view might be redundant if 'list' handles it */}
        {view === "manage" && currentPollToManage && (
          <ManagePollControls poll={currentPollToManage} />
        )}

        {view === "results" && latestResults && (
          <>
            <PollResultsDisplay pollResults={latestResults} />
            <Button
              onClick={() => setView("list")}
              variant="outline"
              className="mt-2"
            >
              Back to Polls List
            </Button>
          </>
        )}
        {view === "results" && !latestResults && isLoadingResults && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="animate-spin h-6 w-6 text-primary" />
            <p className="ml-2">Loading results...</p>
          </div>
        )}

        {/* Section to view results of other closed polls (if listed) */}
        {/* This would require fetching a list of past polls for the livestream */}
      </div>
    </ScrollArea>
  );
};
