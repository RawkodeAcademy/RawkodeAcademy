import { useChat, useDataChannel, useRoomContext } from "@livekit/components-react"; // Added useDataChannel
import { actions } from "astro:actions";
import { MessageSquare, Send, Smile, Star } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage as APIChatMessage } from "@/actions/chat"; // Renamed to avoid conflict
import { useRoomPermissions } from "@/components/livestreams/room/hooks/useRoomPermissions";
import { Button } from "@/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "@/components/ui/EmojiPicker";

// Chat Section Component using LiveKit's useChat hook
interface ChatProps {
  token: string | null;
  onNewMessage?: () => void;
}

export function Chat({ token, onNewMessage }: ChatProps) {
  const { chatMessages, send } = useChat();
  const [messageText, setMessageText] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [historicalMessages, setHistoricalMessages] = useState<
    APIChatMessage[]
  >([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const room = useRoomContext();
  const permissions = useRoomPermissions();
  const previousMessageCountRef = useRef(chatMessages.length);
  const loadedMessageIdsRef = useRef(new Set<string>());

  // Load historical messages
  const loadHistoricalMessages = useCallback(async () => {
    if (!token || !room.name) return;

    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `/api/livestream/chat?roomName=${encodeURIComponent(room.name)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const messages: APIChatMessage[] = await response.json();
        setHistoricalMessages(messages);
        // Mark all historical messages as loaded to avoid duplicates
        for (const msg of messages) {
          loadedMessageIdsRef.current.add(`hist-${msg.id}`); // Keep internal ID for UI keys
        }
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [token, room.name]);

  // Load historical messages on mount and when room changes
  useEffect(() => {
    if (room.name && token) {
      loadHistoricalMessages();
    }
  }, [room.name, token, loadHistoricalMessages]);

  // Reload messages when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && room.name && token) {
        loadHistoricalMessages();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [room.name, token, loadHistoricalMessages]);

  // Auto-scroll to top when new messages arrive
  useEffect(() => {
    // Scroll to top whenever messages change
    if (
      messagesContainerRef.current &&
      (chatMessages.length > 0 || historicalMessages.length > 0)
    ) {
      messagesContainerRef.current.scrollTop = 0;
    }

    // Call onNewMessage when a new message is received
    if (chatMessages.length > previousMessageCountRef.current && onNewMessage) {
      onNewMessage();
    }
    previousMessageCountRef.current = chatMessages.length;
  }, [chatMessages.length, historicalMessages.length, onNewMessage]);

  const handleSendMessage = async () => {
    if (messageText.trim() && send && permissions.canSendChatMessages) {
      const processedMessage = messageText.trim();
      setMessageText(""); // Clear input immediately

      try {
        // Send LiveKit message
        await send(processedMessage);

        // Call the API endpoint
        if (token) {
          await fetch("/api/livestream/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              roomName: room.name,
              message: processedMessage,
            }),
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart || 0;
      const end = inputRef.current.selectionEnd || 0;
      const text = messageText;
      const newText = text.slice(0, start) + emoji + text.slice(end);
      setMessageText(newText);

      // Focus back on input and set cursor position after emoji
      setTimeout(() => {
        inputRef.current?.focus();
        const newCursorPos = start + emoji.length;
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
    setEmojiPickerOpen(false);
  };

  // Listen for LiveKit data messages for real-time promotion updates in the chat list
  useDataChannel("chat:promoted", (message) => {
    try {
      const decoder = new TextDecoder();
      const receivedData = JSON.parse(decoder.decode(message.payload));

      if (receivedData.type === "message_promoted" && receivedData.message) {
        const promotedMsg = receivedData.message as APIChatMessage;
        setHistoricalMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === promotedMsg.id
              ? { ...msg, isPromoted: true }
              : msg,
          ),
        );
        // Also, if the promoted message is a new one not yet in historical,
        // this won't update it. The main promoted display handles new ones.
        // This listener primarily ensures existing messages in the chat list reflect their promoted state.
      }
    } catch (e) {
      console.error("Error processing data channel message in Chat.tsx:", e);
    }
  });

  // Function to render message with clickable links
  const renderMessageWithLinks = (text: string) => {
    // More robust URL regex that handles:
    // - URLs with/without protocol
    // - Common TLDs
    // - Query parameters and fragments
    // - Trailing punctuation (won't include it in the link)
    const urlRegex =
      /(?:(?:https?:\/\/)?(?:www\.)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?::[0-9]+)?(?:\/[^\s]*)?)|(?:https?:\/\/(?:localhost|(?:[0-9]{1,3}\.){3}[0-9]{1,3})(?::[0-9]+)?(?:\/[^\s]*)?)/gi;

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let elementIndex = 0;

    // Find all matches
    match = urlRegex.exec(text);
    while (match !== null) {
      const url = match[0];
      const matchStart = match.index;

      // Remove trailing punctuation from URL if present
      let cleanUrl = url;
      const trailingPunctuation = cleanUrl.match(/[.,;:!?)]+$/);
      let punctuation = "";

      if (trailingPunctuation) {
        punctuation = trailingPunctuation[0];
        cleanUrl = cleanUrl.slice(0, -punctuation.length);
      }

      // Add text before the URL
      if (matchStart > lastIndex) {
        elements.push(
          <span key={`text-${elementIndex++}`}>
            {text.slice(lastIndex, matchStart)}
          </span>,
        );
      }

      // Add the URL as a link
      let href = cleanUrl;
      // Add protocol if missing
      if (!cleanUrl.match(/^https?:\/\//)) {
        href = `https://${cleanUrl}`;
      }

      elements.push(
        <a
          key={`link-${elementIndex++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {cleanUrl}
        </a>,
      );

      // Add trailing punctuation if any
      if (punctuation) {
        elements.push(
          <span key={`punct-${elementIndex++}`}>{punctuation}</span>,
        );
      }

      lastIndex = matchStart + url.length;
      match = urlRegex.exec(text);
    }

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key={`text-${elementIndex++}`}>{text.slice(lastIndex)}</span>,
      );
    }

    return elements.length > 0 ? elements : text;
  };

  // Merge and deduplicate messages
  const mergedMessages = (() => {
    const allMessages = [];

    // Add historical messages
    for (const msg of historicalMessages) {
      allMessages.push({
        dbId: msg.id, // Store original DB ID
        uiId: `hist-${msg.id}`, // Unique ID for React key prop
        message: msg.message,
        participantName: msg.participantName,
        participantIdentity: msg.participantIdentity,
        timestamp: new Date(msg.createdAt).getTime(),
        isPromoted: msg.isPromoted, // Make sure this is included
      });
    }

    // Add LiveKit messages (these are real-time)
    // These won't have a dbId or isPromoted status initially
    // and thus won't show a promote button until they are persisted
    // and re-fetched as part of historical messages.
    for (const msg of chatMessages) {
      // Skip if this message might be a duplicate of a historical message
      // We check by matching participant identity and message content within a small time window
      const isDuplicate = historicalMessages.some(
        (histMsg) =>
          histMsg.participantIdentity === (msg.from?.identity || "anonymous") &&
          histMsg.message === msg.message &&
          Math.abs(
            new Date(histMsg.createdAt).getTime() - (msg.timestamp || 0),
          ) < 5000, // 5 second window
      );

      if (!isDuplicate) {
        allMessages.push({
          uiId: msg.id, // LiveKit message ID for React key
          dbId: undefined, // No DB ID for real-time messages yet
          message: msg.message,
          participantName:
            msg.from?.attributes?.displayName ||
            msg.from?.identity ||
            "Anonymous",
          participantIdentity: msg.from?.identity || "anonymous",
          timestamp: msg.timestamp || Date.now(),
          isPromoted: false, // Real-time messages are not promoted by default
        });
      }
    }

    // Sort by timestamp (newest first for reverse display)
    return allMessages.sort((a, b) => b.timestamp - a.timestamp);
  })();

  const handlePromoteMessage = async (messageId: number | undefined) => {
    if (messageId === undefined) {
      console.error("Cannot promote message without a database ID");
      return;
    }
    if (permissions.role !== "director") {
      console.error("User does not have permission to promote messages.");
      return;
    }
    try {
      const result = await actions.chat.promoteChatMessage({ messageId });
      if (result.error) {
        console.error("Failed to promote message:", result.error.message);
        // Optionally: show a toast notification to the user
      } else {
        console.log("Message promoted successfully:", result.data);
        // Optionally: Update local state to reflect promotion immediately
        // or wait for LiveKit data message to update UI (preferred for consistency)
      }
    } catch (e) {
      console.error("Error calling promoteChatMessage action:", e);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-2 mb-3 min-h-0 custom-scrollbar"
      >
        <div>
          {isLoadingHistory ? (
            <div className="text-xs text-muted-foreground text-center py-8">
              <div className="animate-pulse">Loading messages...</div>
            </div>
          ) : mergedMessages.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No messages yet
            </div>
          ) : (
            <div>
              {mergedMessages.map((msg) => (
                <div
                  key={msg.uiId} // Use uiId for React key
                  className={`mb-3 last:mb-1 p-2 rounded-lg hover:bg-accent/50 transition-colors group relative ${
                    msg.isPromoted ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="text-xs font-medium text-primary flex justify-between items-center">
                    <span>{msg.participantName}</span>
                    {permissions.role === "director" && msg.dbId !== undefined && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                          msg.isPromoted ? "text-primary" : "text-muted-foreground"
                        }`}
                        onClick={() => handlePromoteMessage(msg.dbId)}
                        title={msg.isPromoted ? "Promoted" : "Promote message"}
                        disabled={msg.isPromoted} // Disable if already promoted
                      >
                        <Star className={`h-3 w-3 ${msg.isPromoted ? "fill-current" : ""}`} />
                      </Button>
                    )}
                  </div>
                  <div className="text-sm mt-0.5 text-foreground break-words">
                    {renderMessageWithLinks(msg.message)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {permissions.canSendChatMessages ? (
        <div className="flex gap-2 flex-shrink-0 mt-auto">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 min-w-0 h-10 px-3 py-2 text-sm bg-background/80 backdrop-blur-sm border border-border rounded-xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all text-foreground placeholder-muted-foreground"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
          />
          <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-10 w-10 p-0 hover:bg-accent rounded-xl border border-border flex-shrink-0"
                title="Add emoji"
              >
                <Smile className="h-4 w-4 text-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="p-0 w-[320px] overflow-hidden"
              align="end"
            >
              <EmojiPicker
                className="h-[350px] w-full"
                onEmojiSelect={(emoji) => handleEmojiSelect(emoji.emoji)}
              >
                <EmojiPickerSearch placeholder="Search emoji..." />
                <EmojiPickerContent className="h-[250px]" />
                <EmojiPickerFooter className="text-xs" />
              </EmojiPicker>
            </PopoverContent>
          </Popover>
          <Button
            size="sm"
            className="h-10 w-10 p-0 rounded-xl font-medium flex-shrink-0"
            onClick={handleSendMessage}
            disabled={!send || messageText.trim().length === 0}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground text-center py-2 flex-shrink-0">
          {permissions.role === "viewer"
            ? "Viewers cannot send messages"
            : "You don't have permission to send messages"}
        </div>
      )}
    </div>
  );
}
