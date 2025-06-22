import type React from "react";
import {
  type FullPollResults,
  PollResults,
} from "@/components/livestreams/room/PollContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";

interface PollResultsDisplayProps {
  pollResults: FullPollResults;
}

export const PollResultsDisplay: React.FC<PollResultsDisplayProps> = ({
  pollResults,
}) => {
  if (!pollResults) {
    return <p>No poll results available.</p>;
  }

  const { question, options, results, totalVotes, status } = pollResults;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Poll Results</CardTitle>
        <CardDescription>"{question}"</CardDescription>
        <p className="text-xs text-muted-foreground">
          Status: {status} | Total Votes: {totalVotes}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {options.map((option, index) => {
          const votesForOption = results[option] || 0;
          const percentage =
            totalVotes > 0 ? (votesForOption / totalVotes) * 100 : 0;
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">{option}</span>
                <span className="text-muted-foreground">
                  {votesForOption} vote{votesForOption !== 1 ? "s" : ""} (
                  {percentage.toFixed(1)}%)
                </span>
              </div>
              <Progress value={percentage} className="h-3" />
            </div>
          );
        })}
        {totalVotes === 0 && status === "closed" && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No votes were cast for this poll.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
