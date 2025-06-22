import {
  LayoutContextProvider,
  LiveKitRoom as LiveKitRoomComponent,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { cn } from "@/lib/utils";
import "@livekit/components-styles";
import { ConnectionState, RoomEvent, VideoPresets } from "livekit-client";
import {
  AlertCircle,
  Loader2,
  Menu,
  MessageSquare,
  Users,
  X,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Chat } from "@/components/livestreams/room/chat/Chat";
import {
  RaiseHandContext,
  RaiseHandProvider,
} from "@/components/livestreams/room/controls/RaiseHandContext";
import { ControlsSection } from "@/components/livestreams/room/core/ControlsSection";
import { LayoutProvider } from "@/components/livestreams/room/core/LayoutContext";
import { PermissionHandler } from "@/components/livestreams/room/core/PermissionHandler";
import {
  EmojiReactionProvider,
  useEmojiReactions,
} from "@/components/livestreams/room/EmojiReactionContext";
import EmojiReactionOverlay from "@/components/livestreams/room/EmojiReactionOverlay";
import { useMediaPermissions } from "@/components/livestreams/room/hooks/useMediaPermissions"; // For director check
import { ConnectionIndicator } from "@/components/livestreams/room/media/ConnectionIndicator";
import { VideoGrid } from "@/components/livestreams/room/media/VideoGrid";
import { PollProvider, usePolls } from "@/components/livestreams/room/PollContext"; // Import Poll context
import { ParticipantsList } from "@/components/livestreams/room/participants/ParticipantsList";
import { PollsManagementTab } from "@/components/livestreams/room/polls/PollsManagementTab"; // Import Polls Management Tab
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn/alert";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { Progress } from "@/components/shadcn/progress";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import { useLivestreamToken } from "@/hooks/useLivestreamToken";
import { useParticipantInfo } from "@/hooks/useParticipantInfo";
import { useRoomConnection } from "@/hooks/useRoomConnection";

// Props interface
export interface LiveKitRoomProps {
  serverUrl: string;
  roomName: string;
  roomDisplayName: string;
  displayName?: string;
  onLeaveRoom?: (roomName: string) => void;
  className?: string;
}

export default function LiveKitRoom({
  serverUrl,
  roomName,
  roomDisplayName,
  displayName,
  onLeaveRoom,
  className,
}: LiveKitRoomProps) {
  // Custom hooks
  const { initialMediaSettings } = useParticipantInfo();
  const {
    connectionState,
    error,
    setError,
    handleConnected,
    handleDisconnected,
    handleError,
  } = useRoomConnection({ roomName, onLeaveRoom });

  // Get token
  const {
    token,
    isLoading: tokenLoading,
    error: tokenError,
  } = useLivestreamToken({
    roomName,
    displayName,
  });

  // Handle token error
  if (tokenError && !error) {
    setError(tokenError.message);
  }

  // Loading state
  if (tokenLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-background/95">
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <h3 className="text-lg font-semibold">Loading token...</h3>
            <Progress value={20} className="w-48" />
            <p className="text-sm text-muted-foreground">Room: {roomName}</p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-background/95">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            className="w-full mt-4"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  // No token state
  if (!token) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-background/95">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Token</AlertTitle>
          <AlertDescription>
            Failed to get access token for the room.
          </AlertDescription>
          <div className="mt-4">
            <Button
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Go to Homepage
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <LiveKitRoomComponent
        token={token}
        serverUrl={serverUrl}
        connect={true}
        video={initialMediaSettings.video}
        audio={initialMediaSettings.audio}
        options={{
          videoCaptureDefaults: {
            deviceId: initialMediaSettings.videoDeviceId,
            resolution: VideoPresets.h1080.resolution,
          },
          audioCaptureDefaults: {
            deviceId: initialMediaSettings.audioDeviceId,
          },
          adaptiveStream: true,
          dynacast: true,
          publishDefaults: {
            videoCodec: "vp9", // Use VP9 codec for better quality at lower bitrates
            videoEncoding: {
              maxBitrate: 10_000_000, // 10 Mbps for 1080p video
              maxFramerate: 60,
            },
            screenShareEncoding: {
              maxBitrate: 10_000_000, // 10 Mbps default for screen share
              maxFramerate: 60,
            },
            simulcast: false, // Disable simulcast for single high-quality stream
          },
        }}
        onConnected={() => {
          console.log(
            "[DEBUG] LiveKit Room connected with publishing defaults:",
            {
              videoEnabled: initialMediaSettings.video,
              audioEnabled: initialMediaSettings.audio,
              videoDeviceId: initialMediaSettings.videoDeviceId || "default",
              audioDeviceId: initialMediaSettings.audioDeviceId || "default",
              videoResolution: "1920x1080",
              videoCodec: "vp9",
              videoMaxBitrate: 10_000_000,
              videoMaxFramerate: 60,
              screenShareMaxBitrate: 10_000_000,
              screenShareMaxFramerate: 60,
              adaptiveStream: true,
              dynacast: true,
              simulcast: false,
              timestamp: new Date().toISOString(),
            },
          );
          handleConnected();
        }}
        onDisconnected={handleDisconnected}
        onError={handleError}
        className={cn("relative fixed inset-0 bg-background z-20", className)}
        data-lk-theme="default"
      >
        <RaiseHandProvider>
          <EmojiReactionProvider>
            <PollProvider> {/* Wrap with PollProvider */}
              <LayoutContextProvider>
                <LayoutProvider>
                  <DataMessageHandler />
                  <RoomContent
                    roomDisplayName={roomDisplayName}
                    token={token}
                    connectionState={connectionState}
                  />
                  <RoomAudioRenderer />
                  <PermissionHandler />
                  <EmojiReactionDisplay />
                  <ViewerPollsUI /> {/* Add Viewer Polls UI */}
                </LayoutProvider>
              </LayoutContextProvider>
            </PollProvider>
          </EmojiReactionProvider>
        </RaiseHandProvider>
      </LiveKitRoomComponent>
    </>
  );
}

// Helper component to use the context for reactions
function EmojiReactionDisplay() {
  const { reactions, reactionsVisible } = useEmojiReactions();
  if (!reactionsVisible) {
    return null;
  }
  return <EmojiReactionOverlay reactions={reactions} />;
}

// Sidebar content component - extracted to avoid nested component definition
interface SidebarContentProps {
  roomDisplayName: string;
  token: string;
  connectionState: ConnectionState;
  activeTab: "participants" | "chat" | "polls"; // Added "polls"
  setActiveTab: React.Dispatch<React.SetStateAction<"participants" | "chat" | "polls">>;
  unreadMessages: number; // Could be enhanced for poll notifications too
  setUnreadMessages: React.Dispatch<React.SetStateAction<number>>;
}

const SidebarContentComponent: React.FC<SidebarContentProps> = ({
  roomDisplayName,
  token,
  connectionState,
  activeTab,
  setActiveTab,
  unreadMessages,
  setUnreadMessages,
}) => {
  const { isDirector } = useMediaPermissions(); // Get director status

  return (
  <>
    {/* Header */}
    <div className="p-3 border-b border-sidebar-border bg-sidebar">
      <div className="flex items-center justify-center gap-2">
        <span className="font-bold text-sidebar-foreground">
          {roomDisplayName}
        </span>
        <ConnectionIndicator
          status={
            connectionState === ConnectionState.Connected
              ? "connected"
              : connectionState === ConnectionState.Reconnecting
                ? "reconnecting"
                : connectionState === ConnectionState.Connecting
                  ? "connecting"
                  : "disconnected"
          }
        />
      </div>
    </div>

    {/* Content */}
    <div className="flex-1 overflow-hidden p-3 flex flex-col bg-sidebar text-sidebar-foreground">
      {connectionState === ConnectionState.Connected ? (
        <div className="flex flex-col h-full">
          <ControlsSection token={token} />
          <Separator className="my-3" />

          {/* Mobile tabs for participants/chat */}
          <div className="xl:hidden flex gap-2 mb-3">
            {/* Mobile Tabs */}
            <Button
              variant={activeTab === "participants" ? "default": "outline"}
              size="sm"
              className="flex-1"
              onClick={() => {
                setActiveTab("participants");
                setUnreadMessages(0);
              }}
            >
              <Users className="size-4 mr-1" />
              Participants
            </Button>
            <Button
              variant={activeTab === "chat" ? "default": "outline"}
              size="sm"
              className="flex-1 relative"
              onClick={() => {
                setActiveTab("chat");
                setUnreadMessages(0);
              }}
            >
              <MessageSquare className="size-4 mr-1" />
              Chat
              {unreadMessages > 0 && activeTab !== "chat" && (
                <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </Button>
            {isDirector && (
              <Button
                variant={activeTab === "polls" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setActiveTab("polls")}
              >
                Polls
              </Button>
            )}
          </div>

          {/* Desktop: Split view for participants and chat, or full view for polls */}
          {isDirector && activeTab === "polls" ? (
            <div className="flex-1 flex flex-col min-h-0">
              <PollsManagementTab />
            </div>
          ) : (
            <div className="hidden xl:flex flex-col flex-1 gap-3">
              {/* Participants section - 50% height */}
              <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="h-full">
                  <ParticipantsList token={token} />
                </ScrollArea>
              </div>
              <Separator />
              {/* Chat section - 50% height */}
              <div className="flex-1 flex min-h-0">
                <Chat token={token} />
              </div>
            </div>
          )}

          {/* Mobile: Show active tab content */}
          <div className="flex-1 xl:hidden overflow-hidden">
            {activeTab === "participants" && (
              <ScrollArea className="h-full">
                <ParticipantsList token={token} />
              </ScrollArea>
            )}
            {activeTab === "chat" && (
              <Chat
                token={token}
                onNewMessage={() => {
                  if (activeTab !== "chat") {
                    setUnreadMessages((prev) => prev + 1);
                  }
                }}
              />
            )}
            {isDirector && activeTab === "polls" && (
              <PollsManagementTab />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Loader2 className="size-8 animate-spin mx-auto mb-2" />
            <p>Connecting to room...</p>
          </div>
        </div>
      )}
    </div>
  </>
);

// Room content component
interface RoomContentProps {
  roomDisplayName: string;
  token: string;
  connectionState: ConnectionState;
}

function RoomContent({
  roomDisplayName,
  token,
  connectionState,
}: RoomContentProps) {
  const [activeTab, setActiveTab] = useState<"participants" | "chat" | "polls">("chat");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDirector } = useMediaPermissions(); // Also needed here for mobile menu button

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [mobileMenuOpen]);

  return (
    <div className="fixed inset-0 flex">
      {/* Main video grid area */}
      <div className="flex-1 h-full overflow-hidden relative bg-gray-100 dark:bg-background">
        <VideoGrid />

        {/* Mobile menu button - shown on sm and md breakpoints */}
        <div className="xl:hidden absolute top-2 right-2 z-10">
          {!mobileMenuOpen && (
            <Button
              size="icon"
              variant="outline"
              className="bg-background/80 backdrop-blur-sm border-foreground/20"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5 text-foreground" />
              {(unreadMessages > 0 && (activeTab !== "chat" || !isDirector || activeTab !== "polls")) && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {unreadMessages}
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Custom Mobile Sidebar - shown on sm, md, and lg breakpoints */}
        {mobileMenuOpen && (
          <div className="xl:hidden">
            {/* Backdrop */}
            <button
              type="button"
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close sidebar"
            />

            {/* Sidebar Panel */}
            <div className="fixed inset-y-0 right-0 w-full sm:w-96 z-50 transform transition-transform duration-300 ease-in-out">
              <div className="h-full bg-sidebar border-l border-sidebar-border flex flex-col overflow-hidden">
                {/* Close button */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 z-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>

                <SidebarContentComponent
                  roomDisplayName={roomDisplayName}
                  token={token}
                  connectionState={connectionState}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  unreadMessages={unreadMessages}
                  setUnreadMessages={setUnreadMessages}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar - only shown on xl breakpoint and above */}
      <div
        className={cn(
          "hidden xl:flex w-80 h-full bg-sidebar border-l border-sidebar-border flex-col overflow-hidden",
          connectionState !== ConnectionState.Connected &&
            "pointer-events-none opacity-50",
        )}
      >
        <SidebarContentComponent
          roomDisplayName={roomDisplayName}
          token={token}
          connectionState={connectionState}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadMessages={unreadMessages}
          setUnreadMessages={setUnreadMessages}
        />
      </div>
    </div>
  );
}

// Data message handler component for raise hand functionality
function DataMessageHandler() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { setRaisedHand } = useContext(RaiseHandContext);
  const { addReaction } = useEmojiReactions();
  const { setActivePoll, setLatestResults, clearPollState } = usePolls(); // Get poll context functions

  useEffect(() => {
    if (!room || !localParticipant) return;

    const handleDataReceived = (
      payload: Uint8Array,
      _participant: unknown,
      _kind: unknown,
      _topic?: string,
    ) => {
      try {
        const message = JSON.parse(new TextDecoder().decode(payload));

        switch (message.type) {
          case "raise_hand_request": {
            setRaisedHand(message.identity, message.raised, message.timestamp);
            break;
          }
          case "raise_hand_response": {
            setRaisedHand(message.targetIdentity, false, message.timestamp);
            break;
          }
          case "emoji_reaction": {
            if (message.emoji && message.senderParticipantId && message.timestamp) {
              addReaction({
                emoji: message.emoji,
                senderParticipantId: message.senderParticipantId,
                timestamp: message.timestamp,
              });
            } else {
              console.warn("Received malformed emoji_reaction message:", message);
            }
            break;
          }
          case "poll_open": {
            if (message.poll?.id && message.poll.question && message.poll.options) { // Applied optional chaining
              setActivePoll({
                id: message.poll.id,
                question: message.poll.question,
                options: message.poll.options,
                status: "open",
                openedAt: message.poll.openedAt || new Date().toISOString(),
              });
              setLatestResults(null);
            } else {
              console.warn("Received malformed poll_open message:", message);
            }
            break;
          }
          case "poll_closed": {
            if (message.pollId) {
              setActivePoll((prevPoll) => {
                if (prevPoll?.id === message.pollId) { // Applied optional chaining
                  return { ...prevPoll, status: "closed", closedAt: message.closedAt || new Date().toISOString() };
                }
                return null;
              });
            } else {
              console.warn("Received malformed poll_closed message:", message);
            }
            break;
          }
          case "poll_update": {
            console.log("[LiveKitRoom] Received poll_update:", message);
            break;
          }
          case "poll_results": {
            if (message.data?.pollId && message.data.results) { // Applied optional chaining
              setLatestResults(message.data);
            } else {
              console.warn("Received malformed poll_results message:", message);
            }
            break;
          }
        }
      } catch (error) { // Added curly brace for catch block
        console.error("Error parsing data message:", error);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, localParticipant, setRaisedHand, addReaction, setActivePoll, setLatestResults, clearPollState]);

  return null;
}
