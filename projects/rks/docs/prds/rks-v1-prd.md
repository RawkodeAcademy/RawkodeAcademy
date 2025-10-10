# Rawkode Studio v1 — Product Requirements Document (PRD)

Status: Draft • Date: 2025-10-09 • Owner: Product/Engineering

## 1. Vision
Build a production‑grade, browser‑based live streaming and podcast recording studio for solo creators. It delivers low‑latency shows to public viewers via Cloudflare Realtime (RTK), while capturing studio‑quality, per‑participant ISO recordings locally with resilient, progressive uploads to R2.

## 2. Primary Users
- Producer (solo creator): Runs the show from Chrome desktop, manages scenes, guests, and transitions.
- Guests (authenticated): Join from Chrome desktop with camera/mic/screenshare. Receive a near‑real‑time return video and hear others via SFU audio.
- Viewers (public): Watch with minimal latency on all major browsers (desktop and mobile). Can vote in polls anonymously.

## 3. v1 Scope (Must‑haves)
- Scheduling & Preconfigured Shows: Create/edit a Show with start time, title, description, and scene presets (Holding, Monologue, Discourse, Outro).
- Scenes & Dynamic Grid: Scene graph in TypeScript; dynamic grid controls to add/remove producer/guests/screenshares at runtime; transitions: blur, crossfade, wipe.
- Simulcast Program Output: Producer publishes a program track with 1080p/720p/360p ladder to RTK for ABR.
- Public WebRTC Viewing: Low‑latency player with Auto/1080/720/360 selector; mobile and desktop supported.
- Comments (auth‑only, external not required): Consume comments from a provided WebSocket endpoint; show on stream overlay; producer moderation controls.
- Interactivity: Polls (anonymous voting), RTK Whiteboard plugin enabled and composited into program when active.
- Raise‑Hand Promotion: Authenticated viewers can request to join stage; producer approves to promote to guest.
- Local ISO Recording: Each participant records camera, microphone, and screenshare locally (WebM), progressive resumable upload to R2; resume up to 7 days after disconnect.
- Cloud Backup Recording: Per‑show program recording (1080p30 H.264/AAC MP4) captured by a headless recorder client (Cloudflare Container) and saved to R2.
- AuthN/AuthZ: atproto OAuth with Better Auth; roles = Producer, Guest, Viewer; only authenticated users may comment, vote (anonymous allowed), raise hand, or join.
- Control Plane: Cloudflare Workers + Durable Objects manage shows, sessions, presence, permissions, and track routing.
- Messaging: Outbound state to clients via RTK DataChannel broadcast; inbound events (votes, hands‑up, comments) via provided WebSocket → DO → DataChannel rebroadcast.

## 4. Non‑Goals (v1)
- Multi‑producer control, co‑hosts.
- Multistreaming to YouTube/LinkedIn/Twitch/RTMP.
- Server‑side ISO recording (cloud ISO mixers).
- Desktop/mobile native apps.
- Stinger animations (full‑screen or alpha) — transitions only.

## 5. Platform & Support
- Producer: Chrome (latest stable) on macOS/Windows desktop only.
- Guests: Chrome (latest stable) on desktop only.
- Viewers: Chromium, Safari, Firefox on desktop; iOS Safari and Android Chrome on mobile.

## 6. Media & Quality Targets
- Program output: 1080p30 primary; simulcast 1080/720/360; H.264 video, Opus audio; target bitrates ≈ 5.5/3.0/0.8 Mbps + 128 kbps audio. Keyframe interval 2s.
- Local ISO: 4K30 supported (where hardware permits), default high bitrate WebM (VP9/Opus or H.264 if available); priority is quality; progressive upload to R2.
- Cloud backup: MP4 H.264/AAC 1080p30 at ~6–8 Mbps video + 256 kbps audio.

## 7. Latency & Reliability Objectives
- Guest interaction (producer↔guest): “Meet‑like” real‑time conversational quality.
- Viewer glass‑to‑glass: p50 ≤ 2 s, p95 ≤ 5 s.
- Viewer startup: First frame ≤ 2 s p50 on broadband.
- Session stability: Stable at up to 8 participants on stage.
- Recording reliability: 0 data loss target for local ISOs with resumable uploads up to 7 days.

## 8. Capacity & Cost Envelope
- Audience scale: 0–50 concurrent viewers per live show.
- RTK egress: ≤ 1,000 GB/month free tier typically covers several shows; beyond that billed at $0.05/GB.
- Producer bandwidth: Uplink ≥ 12 Mbps sustained (15–20 Mbps recommended) for three‑layer simulcast; downlink ≥ 30 Mbps when pulling eight 720p guest feeds.

## 9. Core Flows
- Schedule Show: Producer creates show with title/time, selects default scenes and assets.
- Producer Start: Auth → join control room → preview → go live → manage scenes/grids/transitions.
- Guest Join: Auth → device check → join green room → added to dynamic grid on approval.
- Viewer Watch: Open public link → WebRTC join → auto quality; manual override via selector.
- Polls/Comments: WebSocket events → DO authorize/aggregate → broadcast via DataChannel to all clients; producer chooses which to overlay.
- Whiteboard: Enable RTK whiteboard plugin; render in program when active; include whiteboard audio if present.
- Recording: Local ISO starts on join; chunks uploaded progressively to R2; program backup recorded by container subscriber.
- End Show: Stop live; persist metadata; finalize recordings; allow guest upload resume for 7 days.

## 10. Acceptance Criteria (high‑level)
- Scheduling: Create/edit/delete shows; scene presets saved and loaded.
- Scenes: Dynamic grid add/remove updates program within 200 ms; transitions render at 30 fps.
- Viewing: Simulcast ABR works; manual quality selector switches within 1–2 s without disconnect.
- Comments: Auth users post; producer can pin/hide; selected comments render on program.
- Polls: Anonymous votes accepted; tallies update within 500 ms; results can render on program.
- Raise‑Hand: Auth viewers request; producer approves; promoted user joins as guest within 5 s.
- Local ISOs: Per‑participant camera/audio/screenshare recorded; uploads resume after tab close/crash within 7 days; integrity validated by hashes.
- Cloud Backup: MP4 appears in R2 within 5 minutes of show end; playable in standard NLEs.
- Latency: Meets targets in §7 on baseline networks.

## 11. Data & Storage
- R2: Single media bucket with `sessions/{sessionId}/program/*` and `sessions/{sessionId}/iso/*`; multipart uploads, manual retention.
- D1: Shows, scenes, schedules, users, roles, sessions, track refs, asset manifests, recording manifests, upload parts, resumable tokens.
- KV (optional): Ephemeral presence cache, viewer counters.

## 12. Security & Privacy
- OAuth via atproto (Better Auth). JWT/Session cookies with rotation.
- Signed URL (R2) for multipart uploads; per‑user prefixes; server‑verified manifests.
- Content moderation hooks for comments; role checks for raise‑hand.

## 13. Dependencies
- Cloudflare Realtime (RTK) SFU/DataChannels/TURN (as needed), Workers, Durable Objects, R2, D1.
- User‑provided WebSocket endpoint for comments (ingress only).

## 14. Risks & Mitigations
- Producer hardware variance: Limit producer support to Chrome desktop; recommend system check.
- Browser MediaRecorder variability: Default to WebM for reliability; accept H.264 if available.
- Network churn: Reconnect with session resumption; track timeout handling; state snapshot API.
- Container recorder restarts: Pion WebRTC auto‑reconnect and segment rollovers; idempotent R2 writes.

## 15. Milestones
- M0: Architecture validated, core RFCs accepted.
- M1: Producer UI + dynamic grid + transitions; RTK simulcast; viewer player with selector.
- M2: Auth + guests; comments/polls; whiteboard rendering; raise‑hand.
- M3: Local ISO progressive upload + resume; cloud backup recorder to R2.
- Launch: v1 complete per acceptance criteria and SLOs.
