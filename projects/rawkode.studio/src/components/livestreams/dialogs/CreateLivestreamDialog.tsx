import { actions } from "astro:actions";
import { z } from "astro:schema";
import { Spinner } from "@/components/common/Spinner";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { SidebarGroupAction } from "@/components/shadcn/sidebar";
import { queryClient } from "@/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dice5, Plus, X } from "lucide-react";
import { motion } from "motion/react";
import * as randomWords from "random-words";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import React from "react";
import { useForm } from "react-hook-form";

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name must be at least 1 character." })
    .max(64, { message: "Name must be at most 64 characters." }),
  maxParticipants: z.coerce
    .number()
    .min(1, {
      message: "Max participants must be at least 1.",
    })
    .max(100, {
      message: "Max participants must be at most 100.",
    }),
  enableAutoEgress: z.boolean(),
  encodingPreset: z
    .enum([
      "H264_720P_30",
      "H264_720P_60",
      "H264_1080P_30",
      "H264_1080P_60",
      "PORTRAIT_H264_720P_30",
      "PORTRAIT_H264_720P_60",
      "PORTRAIT_H264_1080P_30",
      "PORTRAIT_H264_1080P_60",
    ])
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

// Define the interface for the ref
interface CreateLivestreamsDialogRef {
  setOpen: (open: boolean) => void;
}

// Export the type separately to avoid issues with forwardRef
export type { CreateLivestreamsDialogRef };

export default React.forwardRef<
  CreateLivestreamsDialogRef,
  {
    hideTrigger?: boolean;
  }
>(function CreateLivestreamsDialog(props, ref) {
  const { hideTrigger = false } = props;
  const [open, setOpen] = useState(false);
  const [nameExists, setNameExists] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [creationStatus, setCreationStatus] = useState<
    "idle" | "creating" | "verifying" | "complete"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const createdRoomNameRef = useRef<string | null>(null);

  // Expose setOpen method to parent component via ref
  useImperativeHandle(ref, () => ({
    setOpen,
  }));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      maxParticipants: 10,
      enableAutoEgress: false,
      encodingPreset: "H264_1080P_60",
    },
  });

  const watchedName = form.watch("name");
  const watchedEnableAutoEgress = form.watch("enableAutoEgress");

  // Query to get existing rooms
  const { data: rooms } = useQuery({
    queryKey: ["livestreams"],
    queryFn: async () => {
      const { data, error } = await actions.rooms.listRooms();
      if (error) throw error;
      return data;
    },
    enabled: open, // Only run query when dialog is open
  });

  // Check if room name already exists when name changes
  useEffect(() => {
    if (rooms && watchedName) {
      const exists = rooms.some((room) => room.name === watchedName);
      setNameExists(exists);
    } else {
      setNameExists(false);
    }
  }, [watchedName, rooms]);

  // Room creation verification query with built-in polling
  const verificationQuery = useQuery({
    queryKey: ["roomCreationVerification", createdRoomNameRef.current],
    queryFn: async () => {
      if (!createdRoomNameRef.current) {
        throw new Error("No room name to verify");
      }

      // Get fresh list of rooms from API
      const { data: freshRooms, error } = await actions.rooms.listRooms();

      if (error) throw error;
      if (!freshRooms) throw new Error("No data received");

      // Check if room exists in the list
      const roomExists = freshRooms.some(
        (room) => room.name === createdRoomNameRef.current,
      );

      // If room doesn't exist yet, throw error to trigger retry
      if (!roomExists) {
        throw new Error("Room not found yet");
      }

      // Return true if room exists (success)
      return true;
    },
    enabled:
      creationStatus === "verifying" && createdRoomNameRef.current !== null,
    refetchInterval: 1500,
    refetchOnWindowFocus: false,
    staleTime: 0,
    retry: 20,
    retryDelay: 1500,
  });

  // Handle successful verification
  React.useEffect(() => {
    if (verificationQuery.isSuccess && creationStatus === "verifying") {
      queryClient.invalidateQueries({ queryKey: ["livestreams"] });
      setIsCreating(false);
      setCreationStatus("complete");
      setOpen(false);
      form.reset();
      createdRoomNameRef.current = null;
    }
  }, [verificationQuery.isSuccess, creationStatus, form]);

  // Handle max retries reached
  React.useEffect(() => {
    if (
      verificationQuery.failureCount >= 20 &&
      creationStatus === "verifying"
    ) {
      setError(
        "Room creation took longer than expected. It may still be processing.",
      );
      setIsCreating(false);
      setCreationStatus("idle");
    }
  }, [verificationQuery.failureCount, creationStatus]);

  // Mutation for creating a room
  const { mutate } = useMutation({
    mutationFn: (values: FormData) => {
      // Create the parameters object
      const params: {
        name: string;
        maxParticipants: number;
        emptyTimeout?: number;
        enableAutoEgress?: boolean;
        encodingPreset?: string;
      } = {
        name: values.name,
        maxParticipants: values.maxParticipants,
        enableAutoEgress: values.enableAutoEgress,
      };

      // Add emptyTimeout (will be ignored if not supported by the action)
      params.emptyTimeout = 120; // 2 minutes timeout

      // Add encoding preset if auto egress is enabled
      if (values.enableAutoEgress && values.encodingPreset) {
        params.encodingPreset = values.encodingPreset;
      }

      return actions.rooms.createRoom(params);
    },
    onSuccess: (_, variables) => {
      // Store created room name to check later
      createdRoomNameRef.current = variables.name;

      // Set status to verifying to trigger the verification process
      setCreationStatus("verifying");
    },
    onError: (err) => {
      setIsCreating(false);
      setCreationStatus("idle");
      setError(err instanceof Error ? err.message : "Failed to create room");
    },
  });

  const handleFormSubmit = (values: FormData) => {
    if (nameExists) {
      return; // Prevent submission if name exists
    }

    setIsCreating(true);
    setCreationStatus("creating");
    setError(null);
    mutate(values);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Only allow closing if not in creating state
        if (isCreating && newOpen === false) {
          return;
        }
        setOpen(newOpen);
        if (!newOpen) {
          form.reset();
          setError(null);
          setNameExists(false);
          setCreationStatus("idle");
        }
      }}
    >
      {!hideTrigger && (
        <DialogTrigger asChild>
          <SidebarGroupAction title="Create Live Stream">
            <Plus />
            <span className="sr-only">Create Live Stream</span>
          </SidebarGroupAction>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {isCreating && (
          <motion.div
            className="absolute inset-x-0 top-0 h-1 bg-primary z-50 origin-left"
            initial={{ scaleX: 0 }}
            animate={{
              scaleX: creationStatus === "verifying" ? 0.85 : 0.4,
              transition: { duration: 2, ease: "easeOut" },
            }}
          />
        )}
        <DialogClose
          className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          disabled={isCreating}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <DialogHeader>
          <DialogTitle>Create a new Live Stream</DialogTitle>
          <DialogDescription>
            Enter details for your new live stream room.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Name"
                            disabled={isCreating}
                            {...field}
                          />
                        </FormControl>
                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              // Generate 4 random words and join them with dashes
                              const words = randomWords.generate({
                                exactly: 4,
                              }) as string[];
                              const roomName = words.join("-");
                              // Update the form field
                              form.setValue("name", roomName);
                            }}
                            disabled={isCreating}
                            title="Generate random room name"
                          >
                            <Dice5 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {nameExists && (
                        <p className="text-sm text-destructive">
                          A room with this name already exists.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max participants</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Max participants"
                          disabled={isCreating}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 lg:border-l lg:pl-6">
                <FormField
                  control={form.control}
                  name="enableAutoEgress"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isCreating}
                        />
                      </FormControl>
                      <div className="flex-1">
                        <FormLabel className="text-sm font-normal">
                          Enable auto-recording
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Automatically record all tracks and composite view
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="encodingPreset"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Encoding Preset</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isCreating || !watchedEnableAutoEgress}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an encoding preset" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="H264_720P_30">
                            720p 30fps (3 Mbps)
                          </SelectItem>
                          <SelectItem value="H264_720P_60">
                            720p 60fps (4.5 Mbps)
                          </SelectItem>
                          <SelectItem value="H264_1080P_30">
                            1080p 30fps (4.5 Mbps)
                          </SelectItem>
                          <SelectItem value="H264_1080P_60">
                            1080p 60fps (6 Mbps)
                          </SelectItem>
                          <SelectItem value="PORTRAIT_H264_720P_30">
                            Portrait 720p 30fps (3 Mbps)
                          </SelectItem>
                          <SelectItem value="PORTRAIT_H264_720P_60">
                            Portrait 720p 60fps (4.5 Mbps)
                          </SelectItem>
                          <SelectItem value="PORTRAIT_H264_1080P_30">
                            Portrait 1080p 30fps (4.5 Mbps)
                          </SelectItem>
                          <SelectItem value="PORTRAIT_H264_1080P_60">
                            Portrait 1080p 60fps (6 Mbps)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Choose a preset that matches your streaming requirements
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {error && !isCreating && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <Button type="submit" disabled={isCreating || nameExists}>
                {isCreating ? (
                  <>
                    <Spinner size="small" className="mr-1 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});
