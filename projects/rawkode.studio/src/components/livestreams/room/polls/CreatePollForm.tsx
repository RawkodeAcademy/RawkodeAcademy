import { actions } from "astro:actions";
import { useRoomContext } from "@livekit/components-react";
import { PlusCircle, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { usePolls } from "@/components/livestreams/room/PollContext";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea"; // For question

interface CreatePollFormProps {
  onPollCreated?: (pollId: string) => void; // Callback after successful creation
  // livestreamId is derived from room context
}

export const CreatePollForm: React.FC<CreatePollFormProps> = ({
  onPollCreated,
}) => {
  const room = useRoomContext();
  const { setActivePoll } = usePolls(); // To potentially set the new poll as active (draft) in UI

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]); // Start with two empty options
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 10) {
      // Max 10 options for sanity
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      // Min 2 options
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room?.name) {
      setError("Room information not available.");
      return;
    }
    setError(null);
    setIsLoading(true);

    const validOptions = options
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);
    if (validOptions.length < 2) {
      setError("Please provide at least two valid options.");
      setIsLoading(false);
      return;
    }
    if (!question.trim()) {
      setError("Question cannot be empty.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await actions.createPoll({
        livestreamId: room.name,
        question: question.trim(),
        options: validOptions,
      });

      if (result.success && result.pollId) {
        console.log("Poll created successfully:", result.pollId);
        // Optionally, update local state or context with this new draft poll
        // For example, if directors have a list of their draft polls:
        // setActivePoll({ id: result.pollId, question, options: validOptions, status: "draft" });
        if (onPollCreated) {
          onPollCreated(result.pollId);
        }
        // Reset form
        setQuestion("");
        setOptions(["", ""]);
      } else {
        setError(result.error || "Failed to create poll.");
      }
    } catch (err) {
      console.error("Error creating poll:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 border rounded-lg bg-card text-card-foreground"
    >
      <h3 className="text-lg font-semibold">Create New Poll</h3>
      <div>
        <Label htmlFor="poll-question">Question</Label>
        <Textarea
          id="poll-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What's your favorite color?"
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label>Options</Label>
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2 mt-1">
            <Input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              required
            />
            {options.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeOption(index)}
                aria-label="Remove option"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        {options.length < 10 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
            className="mt-2"
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add Option
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creating..." : "Create Poll (as Draft)"}
      </Button>
    </form>
  );
};
