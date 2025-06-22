import { actions } from "astro:actions";
import { useRoomContext } from "@livekit/components-react";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { Poll, usePolls } from "@/components/livestreams/room/PollContext";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Label } from "@/components/shadcn/label";
import { RadioGroup, RadioGroupItem } from "@/components/shadcn/radio-group";

// This component will be displayed to viewers when a poll is active
export const ActivePollDisplay: React.FC = () => {
  const { activePoll, setActivePoll, latestResults } = usePolls();
  const room = useRoomContext();
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false); // Simple state to prevent re-voting UI spam

  const handleSubmitVote = async () => {
    if (!activePoll || !selectedOption || !room?.name) {
      setError("Please select an option.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const result = await actions.submitPollResponse({
        pollId: activePoll.id,
        selectedOption: selectedOption,
        livestreamId: room.name,
      });

      if (result.success) {
        setHasVoted(true); // Indicate vote submitted
        // Don't clear activePoll here, it remains open until host closes it.
        // UI can show "Thanks for voting" or similar.
      } else {
        setError(result.error || "Failed to submit vote.");
        setHasVoted(false); // Allow retry if submission failed
      }
    } catch (err) {
      console.error("Error submitting vote:", err);
      setError("An unexpected error occurred while submitting your vote.");
      setHasVoted(false); // Allow retry
    } finally {
      setIsLoading(false);
    }
  };

  // If a new poll opens, reset hasVoted state
  React.useEffect(() => {
    if (activePoll?.status === "open") {
      setHasVoted(false);
      setSelectedOption(undefined); // Clear selection for new poll
      setError(null);
    }
  }, [activePoll?.id, activePoll?.status]);

  if (!activePoll || activePoll.status !== "open") {
    // If there's an active poll that just closed, and we have results, show them.
    if (
      activePoll &&
      activePoll.status === "closed" &&
      latestResults &&
      latestResults.id === activePoll.id
    ) {
      // This part could be a separate component or integrated better.
      // For now, let's not render anything here and assume results are shown elsewhere
      // or the director explicitly shares them.
      // A small message "Poll closed, waiting for results..." could be shown.
      return null;
    }
    return null; // No open poll to display
  }

  if (hasVoted) {
    return (
      <Card className="m-4 p-4 fixed bottom-4 left-4 max-w-sm z-50 shadow-lg animate-in fade-in slide-in-from-bottom-10">
        <CardHeader>
          <CardTitle className="text-md">Poll: {activePoll.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-green-600 dark:text-green-400">
            Thanks for voting!
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Waiting for the host to close the poll or share results.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="m-4 p-4 fixed bottom-4 left-4 max-w-sm z-50 shadow-lg animate-in fade-in slide-in-from-bottom-10">
      <CardHeader>
        <CardTitle className="text-md">Live Poll</CardTitle>
        <CardDescription>{activePoll.question}</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedOption}
          onValueChange={setSelectedOption}
          className="space-y-2"
        >
          {activePoll.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem
                value={option}
                id={`option-${activePoll.id}-${index}`}
              />
              <Label htmlFor={`option-${activePoll.id}-${index}`}>
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmitVote}
          disabled={isLoading || !selectedOption}
          className="w-full"
        >
          {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          Submit Vote
        </Button>
      </CardFooter>
    </Card>
  );
};
