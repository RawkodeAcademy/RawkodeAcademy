import { Button } from "@/components/shadcn/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/shadcn/dialog";
import { Label } from "@/components/shadcn/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/shadcn/select";
import { useLocalParticipant } from "@livekit/components-react";
import {
	type LocalVideoTrack,
	Track,
	createLocalVideoTrack,
} from "livekit-client";
import { Camera, CameraOff, Mic, Settings, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface DeviceSettingsDialogProps {
	className?: string;
}

export function DeviceSettingsDialog({ className }: DeviceSettingsDialogProps) {
	const { localParticipant } = useLocalParticipant();
	const [open, setOpen] = useState(false);
	const [devices, setDevices] = useState<{
		audioInputs: MediaDeviceInfo[];
		videoInputs: MediaDeviceInfo[];
		audioOutputs: MediaDeviceInfo[];
	}>({
		audioInputs: [],
		videoInputs: [],
		audioOutputs: [],
	});
	const [selectedDevices, setSelectedDevices] = useState({
		audioInput: "",
		videoInput: "",
		audioOutput: "",
	});
	const [previewTrack, setPreviewTrack] = useState<LocalVideoTrack | null>(
		null,
	);
	const [cameraEnabled, setCameraEnabled] = useState(true);
	const videoPreviewRef = useRef<HTMLVideoElement>(null);

	const createPreviewTrack = useCallback(async () => {
		if (!cameraEnabled) {
			// If camera is disabled, just cleanup
			setPreviewTrack((prevTrack) => {
				if (prevTrack) {
					prevTrack.stop();
				}
				return null;
			});
			return;
		}

		try {
			// Create new preview track
			const track = await createLocalVideoTrack({
				deviceId: selectedDevices.videoInput,
				resolution: { width: 640, height: 480 },
			});

			// Stop and cleanup the previous preview track
			setPreviewTrack((prevTrack) => {
				if (prevTrack) {
					prevTrack.stop();
				}
				return track;
			});
		} catch (error) {
			console.error("Error creating preview track:", error);
		}
	}, [selectedDevices.videoInput, cameraEnabled]);

	// Get available media devices
	useEffect(() => {
		const getDevices = async () => {
			try {
				const devices = await navigator.mediaDevices.enumerateDevices();
				const audioInputs = devices.filter(
					(device) => device.kind === "audioinput",
				);
				const videoInputs = devices.filter(
					(device) => device.kind === "videoinput",
				);
				const audioOutputs = devices.filter(
					(device) => device.kind === "audiooutput",
				);

				setDevices({ audioInputs, videoInputs, audioOutputs });

				// Get current device selections from active tracks
				if (localParticipant) {
					const micTrack = localParticipant.getTrackPublication(
						Track.Source.Microphone,
					)?.track;
					const camTrack = localParticipant.getTrackPublication(
						Track.Source.Camera,
					)?.track;

					const currentAudioDevice =
						micTrack?.mediaStreamTrack.getSettings().deviceId;
					const currentVideoDevice =
						camTrack?.mediaStreamTrack.getSettings().deviceId;

					// Find the exact device in the list to ensure it exists
					const audioDevice = audioInputs.find(
						(d) => d.deviceId === currentAudioDevice,
					);
					const videoDevice = videoInputs.find(
						(d) => d.deviceId === currentVideoDevice,
					);

					setSelectedDevices({
						audioInput:
							audioDevice?.deviceId ||
							currentAudioDevice ||
							audioInputs[0]?.deviceId ||
							"",
						videoInput:
							videoDevice?.deviceId ||
							currentVideoDevice ||
							videoInputs[0]?.deviceId ||
							"",
						audioOutput: audioOutputs[0]?.deviceId || "",
					});

					// Set camera enabled state based on current track state
					setCameraEnabled(localParticipant.isCameraEnabled);
				}
			} catch (error) {
				console.error("Error enumerating devices:", error);
			}
		};

		if (open) {
			getDevices();
		}
	}, [open, localParticipant]);

	// Cleanup preview track when dialog closes
	useEffect(() => {
		if (!open && previewTrack) {
			previewTrack.stop();
			setPreviewTrack(null);
		}
	}, [open, previewTrack]);

	// Create and attach preview track when dialog opens or camera state changes
	useEffect(() => {
		if (open && selectedDevices.videoInput && videoPreviewRef.current) {
			createPreviewTrack();
		}
	}, [open, selectedDevices.videoInput, createPreviewTrack]);

	// Attach preview track to video element
	useEffect(() => {
		if (previewTrack && videoPreviewRef.current) {
			previewTrack.attach(videoPreviewRef.current);
		}

		return () => {
			if (previewTrack && videoPreviewRef.current) {
				previewTrack.detach(videoPreviewRef.current);
			}
		};
	}, [previewTrack]);

	const handleVideoDeviceChange = async (deviceId: string) => {
		setSelectedDevices((prev) => ({ ...prev, videoInput: deviceId }));
		if (open) {
			await createPreviewTrack();
		}
	};

	const toggleCameraPreview = () => {
		setCameraEnabled((prev) => !prev);
	};

	const handleApplySettings = async () => {
		if (!localParticipant) return;

		try {
			// Update microphone device only if it's currently enabled
			if (selectedDevices.audioInput && localParticipant.isMicrophoneEnabled) {
				const micPublication = localParticipant.getTrackPublication(
					Track.Source.Microphone,
				);
				if (micPublication?.track) {
					// Get current device to check if it changed
					const currentDevice =
						micPublication.track.mediaStreamTrack.getSettings().deviceId;
					if (currentDevice !== selectedDevices.audioInput) {
						await localParticipant.setMicrophoneEnabled(false);
						await localParticipant.setMicrophoneEnabled(true, {
							deviceId: selectedDevices.audioInput,
						});
					}
				}
			}

			// Update camera device only if it's currently enabled
			if (selectedDevices.videoInput && localParticipant.isCameraEnabled) {
				const camPublication = localParticipant.getTrackPublication(
					Track.Source.Camera,
				);
				if (camPublication?.track) {
					// Get current device to check if it changed
					const currentDevice =
						camPublication.track.mediaStreamTrack.getSettings().deviceId;
					if (currentDevice !== selectedDevices.videoInput) {
						await localParticipant.setCameraEnabled(false);
						await localParticipant.setCameraEnabled(true, {
							deviceId: selectedDevices.videoInput,
						});
					}
				}
			}

			// Note: Audio output device selection is handled by the browser/OS
			// and cannot be programmatically set in most browsers

			setOpen(false);
		} catch (error) {
			console.error("Error applying device settings:", error);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					size="sm"
					variant="secondary"
					className={`flex items-center justify-center h-10 rounded-lg border border-sidebar-border/30 ${className}`}
				>
					<Settings className="h-4 w-4 mr-2" />
					Settings
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Device Settings</DialogTitle>
					<DialogDescription>
						Configure your camera, microphone, and speaker settings
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Camera Selection */}
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Camera className="h-4 w-4" />
							<Label htmlFor="camera-select">Camera</Label>
						</div>
						<Select
							value={selectedDevices.videoInput}
							onValueChange={handleVideoDeviceChange}
						>
							<SelectTrigger id="camera-select" className="w-full">
								<SelectValue placeholder="Select a camera" />
							</SelectTrigger>
							<SelectContent>
								{devices.videoInputs.map((device) => (
									<SelectItem key={device.deviceId} value={device.deviceId}>
										{device.label || `Camera ${device.deviceId.slice(0, 8)}`}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Camera Preview with Toggle */}
						<div className="space-y-2">
							<div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
								<video
									ref={videoPreviewRef}
									autoPlay
									playsInline
									muted
									className="w-full h-full object-cover"
									style={{ display: cameraEnabled ? "block" : "none" }}
								/>
								{(!previewTrack || !cameraEnabled) && (
									<div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
										{cameraEnabled ? (
											<Camera className="h-12 w-12" />
										) : (
											<CameraOff className="h-12 w-12" />
										)}
									</div>
								)}
							</div>
							<Button
								type="button"
								size="sm"
								variant={cameraEnabled ? "default" : "secondary"}
								onClick={toggleCameraPreview}
								className="w-full"
							>
								{cameraEnabled ? (
									<>
										<Camera className="h-4 w-4 mr-2" />
										Preview On
									</>
								) : (
									<>
										<CameraOff className="h-4 w-4 mr-2" />
										Preview Off
									</>
								)}
							</Button>
						</div>
					</div>

					{/* Microphone Selection */}
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Mic className="h-4 w-4" />
							<Label htmlFor="mic-select">Microphone</Label>
						</div>
						<Select
							value={selectedDevices.audioInput}
							onValueChange={(value) =>
								setSelectedDevices((prev) => ({ ...prev, audioInput: value }))
							}
						>
							<SelectTrigger id="mic-select" className="w-full">
								<SelectValue placeholder="Select a microphone" />
							</SelectTrigger>
							<SelectContent>
								{devices.audioInputs.map((device) => (
									<SelectItem key={device.deviceId} value={device.deviceId}>
										{device.label ||
											`Microphone ${device.deviceId.slice(0, 8)}`}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Speaker Selection (only available in some browsers) */}
					{devices.audioOutputs.length > 0 && (
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<Volume2 className="h-4 w-4" />
								<Label htmlFor="speaker-select">Speaker</Label>
							</div>
							<Select
								value={selectedDevices.audioOutput}
								onValueChange={(value) =>
									setSelectedDevices((prev) => ({
										...prev,
										audioOutput: value,
									}))
								}
							>
								<SelectTrigger id="speaker-select" className="w-full">
									<SelectValue placeholder="Select a speaker" />
								</SelectTrigger>
								<SelectContent>
									{devices.audioOutputs.map((device) => (
										<SelectItem key={device.deviceId} value={device.deviceId}>
											{device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				</div>

				<div className="flex gap-3">
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
						className="flex-1"
					>
						Cancel
					</Button>
					<Button onClick={handleApplySettings} className="flex-1">
						Apply Settings
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
