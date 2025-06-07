import { PreJoin } from "@livekit/components-react";
import "@livekit/components-styles";
import RoomJoinForm from "@/components/livestreams/forms/RoomJoinForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn/alert";
import type { LocalUserChoices } from "@livekit/components-core";
import { Link, UserCheck } from "lucide-react";
import { useState } from "react";

interface Props {
	roomName: string;
	roomExists: boolean;
	isDirector?: boolean;
	directorName?: string;
}

export default function InviteRoomForm({
	roomName,
	roomExists,
	isDirector,
	directorName,
}: Props) {
	const [defaults] = useState<Partial<LocalUserChoices>>({
		username: directorName || "",
		audioEnabled: false,
		videoEnabled: false,
		audioDeviceId: undefined,
		videoDeviceId: undefined,
	});

	// Note: Session storage is cleared when visiting the invite page
	// to ensure users get a fresh experience when joining via invite link

	const handleJoin = (userChoices: LocalUserChoices) => {
		// Store media preferences
		sessionStorage.setItem(
			"prejoin-audio-enabled",
			userChoices.audioEnabled.toString(),
		);
		sessionStorage.setItem(
			"prejoin-video-enabled",
			userChoices.videoEnabled.toString(),
		);

		// Always use the director name for directors
		if (isDirector && directorName) {
			sessionStorage.setItem("participant-name", directorName);
		}

		// Store device selections if available
		if (userChoices.audioDeviceId) {
			sessionStorage.setItem("prejoin-audio-device", userChoices.audioDeviceId);
		}
		if (userChoices.videoDeviceId) {
			sessionStorage.setItem("prejoin-video-device", userChoices.videoDeviceId);
		}

		// Redirect to watch page
		window.location.href = `/watch/${roomName}`;
	};

	// Show prejoin screen only for directors if room exists
	if (roomExists && isDirector) {
		return (
			<div className="space-y-4">
				<div className="text-center">
					<div className="flex items-center justify-center gap-2 text-muted-foreground">
						<UserCheck className="size-5" />
						<span className="text-sm">
							Signed in as director: {directorName}
						</span>
					</div>
				</div>
				<div className="w-full max-w-2xl mx-auto" data-lk-theme="default">
					<style>{`
						/* Dark theme for LiveKit prejoin */
						[data-lk-theme="default"] {
							--lk-bg: #0a0a0a;
							--lk-bg2: #1a1a1a;
							--lk-bg3: #2a2a2a;
							--lk-fg: #ffffff;
							--lk-fg2: #b8b8b8;
							--lk-fg3: #808080;
							--lk-border: #333333;
							--lk-focus-outline: #4a4a4a;
							--lk-danger: #dc2626;
							--lk-success: #10b981;
							--lk-warning: #f59e0b;
							--lk-control-bg: #1a1a1a;
							--lk-control-hover-bg: #2a2a2a;
							--lk-button-bg: #3b82f6;
							--lk-button-fg: #ffffff;
						}
						
						/* Video preview styling */
						.lk-prejoin .lk-video-track {
							background-color: var(--lk-bg2) !important;
							border: 1px solid var(--lk-border) !important;
							border-radius: var(--radius) !important;
							overflow: hidden !important;
						}
						
						/* Form elements styling */
						.lk-prejoin select,
						.lk-prejoin input {
							background-color: var(--lk-bg2) !important;
							color: var(--lk-fg) !important;
							border: 1px solid var(--lk-border) !important;
							border-radius: calc(var(--radius) - 2px) !important;
							padding: 0.5rem 0.75rem !important;
							font-size: 0.875rem !important;
							transition: all 0.2s !important;
						}
						
						.lk-prejoin select:hover,
						.lk-prejoin input:hover {
							background-color: var(--lk-bg3) !important;
							border-color: var(--lk-border) !important;
						}
						
						.lk-prejoin select:focus,
						.lk-prejoin input:focus {
							outline: 2px solid var(--lk-focus-outline) !important;
							outline-offset: 2px !important;
							border-color: var(--lk-focus-outline) !important;
						}
						
						.lk-prejoin select option {
							background-color: var(--lk-bg2) !important;
							color: var(--lk-fg) !important;
						}
						
						/* Hide username field for directors */
						.lk-prejoin input[name="username"],
						.lk-prejoin label[for="username"] {
							display: none !important;
						}
						
						/* Device toggle buttons - match room controls secondary variant */
						.lk-prejoin button[data-lk-source*="toggle"] {
							background-color: hsl(var(--secondary)) !important;
							color: hsl(var(--secondary-foreground)) !important;
							border: 1px solid hsl(var(--border)) !important;
							border-radius: calc(var(--radius) - 2px) !important;
							height: 2.5rem !important;
							padding: 0 1rem !important;
							font-size: 0.875rem !important;
							font-weight: 500 !important;
							transition: all 0.2s !important;
							display: inline-flex !important;
							align-items: center !important;
							justify-content: center !important;
							gap: 0.5rem !important;
						}
						
						.lk-prejoin button[data-lk-source*="toggle"]:hover {
							background-color: hsl(var(--secondary) / 0.8) !important;
						}
						
						/* Active state - match room controls default variant */
						.lk-prejoin button[data-lk-source*="toggle"][data-lk-enabled="true"] {
							background-color: hsl(var(--primary)) !important;
							color: hsl(var(--primary-foreground)) !important;
							border: 1px solid hsl(var(--border)) !important;
						}
						
						.lk-prejoin button[data-lk-source*="toggle"][data-lk-enabled="true"]:hover {
							background-color: hsl(var(--primary) / 0.9) !important;
						}
						
						/* Join button styling - match room controls primary button */
						.lk-prejoin button[type="submit"],
						.lk-prejoin .lk-join-button {
							background-color: hsl(var(--primary)) !important;
							color: hsl(var(--primary-foreground)) !important;
							border: 1px solid hsl(var(--border)) !important;
							border-radius: calc(var(--radius) - 2px) !important;
							height: 2.5rem !important;
							padding: 0 1.5rem !important;
							font-size: 0.875rem !important;
							font-weight: 500 !important;
							width: 100% !important;
							margin-top: 1rem !important;
							transition: all 0.2s !important;
							cursor: pointer !important;
							display: inline-flex !important;
							align-items: center !important;
							justify-content: center !important;
						}
						
						.lk-prejoin button[type="submit"]:hover:not(:disabled),
						.lk-prejoin .lk-join-button:hover:not(:disabled) {
							background-color: hsl(var(--primary) / 0.9) !important;
						}
						
						.lk-prejoin button[type="submit"]:disabled,
						.lk-prejoin .lk-join-button:disabled {
							opacity: 0.5 !important;
							cursor: not-allowed !important;
						}
						
						/* Labels styling */
						.lk-prejoin label {
							color: var(--lk-fg2) !important;
							font-size: 0.875rem !important;
							font-weight: 500 !important;
							margin-bottom: 0.25rem !important;
							display: block !important;
						}
						
						/* Ensure prejoin container has proper padding */
						.lk-prejoin {
							padding: 1.5rem !important;
							background: transparent !important;
						}
						
						/* Video conference layout */
						.lk-prejoin .lk-video-conference-layout {
							gap: 1rem !important;
						}
						
						/* Control bar styling */
						.lk-prejoin .lk-control-bar {
							background: transparent !important;
							gap: 0.5rem !important;
						}
					`}</style>
					<PreJoin
						defaults={defaults}
						onSubmit={handleJoin}
						onError={(error) => {
							console.error("PreJoin error:", error);
						}}
						persistUserChoices={true}
						userLabel="Your name"
						joinLabel="Join Livestream"
						micLabel="Microphone"
						camLabel="Camera"
					/>
				</div>
			</div>
		);
	}

	return (
		<div id="join-ui" className="mt-6">
			{!roomExists && (
				<Alert variant="destructive">
					<Link className="size-5 mr-2" />
					<AlertTitle>Room Not Available</AlertTitle>
					<AlertDescription>
						This livestream may have ended or doesn't exist.
					</AlertDescription>
				</Alert>
			)}

			{roomExists && <RoomJoinForm roomName={roomName} />}
		</div>
	);
}
