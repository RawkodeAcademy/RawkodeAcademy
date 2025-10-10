---
title: High‑Level Architecture (RTK + Workers/DO + R2/D1)
status: Draft
created: 2025-10-09
owner: Engineering
reviewers: [Product, Infra]
review_window: 2025-10-09 → 2025-10-16
---

## Summary
Rawkode Studio v1 uses Cloudflare Realtime (RTK) as the SFU/data plane, Cloudflare Workers + Durable Objects (DO) as the control plane, R2 for storage, and D1 for persistence. Producer composes the program in‑browser and publishes a simulcast program track to RTK. Viewers subscribe via WebRTC. Local ISOs are recorded in‑browser and uploaded progressively to R2. A headless recorder container subscribes to the program track for a cloud backup MP4 in R2.

## Components
- Producer App (Chrome desktop): Scene editor, dynamic grid, transitions, mixer/compositor, program publisher (simulcast), DataChannel publisher.
- Guest App (Chrome desktop): Publishes camera/mic/screenshare; receives per‑participant audio via SFU; receives program video return.
- Viewer App (desktop/mobile): WebRTC subscriber with Auto/1080/720/360 manual selector; DataChannel consumer.
- Control Plane (Workers + DO): Auth, presence, show/session lifecycle, permissions, track routing, manifests, signed URLs, resumable tokens.
- RTK: SFU for media tracks and DataChannels; optional STUN/TURN.
- R2: Single bucket with session-scoped prefixes under `sessions/{sessionId}/…`; multipart uploads.
- D1: Users, shows, scenes, schedules, sessions, participants, track refs, manifests.
- Cloud Program Recorder (Container): Pion WebRTC client that subscribes to program track, remux/encode to MP4 H.264/AAC, uploads to R2.

## Sessions & Tracks (RTK)
- One WebRTC PeerConnection per client → one RTK session.
- Producer pushes program video (H.264 simulcast) and DataChannel; may pull guest feeds for preview/QA.
- Guests push camera/mic/screenshare as separate tracks; subscribe to others’ audio tracks and program video.
- Viewers subscribe to program video (selected RID) and DataChannel.

## Presence & Routing (DO)
- DO per show‐session maintains: participants, track IDs, scene graph, program track ID, DataChannel ID.
- DO emits authoritative snapshots and deltas; provides signed URLs/tokens for uploads; mediates raise‑hand promotions.

## Messaging
- Outbound: Producer → DO → broadcast via RTK DataChannel. State payloads are versioned, ordered, and include sequence numbers.
- Inbound: Comments, votes, raise‑hand via external WebSocket → DO → authorization/aggregation → rebroadcast as state deltas.

## Recordings
- Local ISOs: MediaRecorder (WebM) per participant; chunked multipart uploads; 7‑day resume window.
- Cloud program backup: Container subscribes to program track; rolls MP4 segments; finalizes in R2.

## Security
- atproto OAuth (Better Auth); session cookies/JWT; per‑role permissions.
- R2 uploads via scoped signed URLs; server‑side manifest verification.

## Drawbacks
- Browser MediaRecorder variability (codec/container differences across OS).
- Producer bandwidth/CPU constrains max inputs and effect complexity.

## Adoption Plan
Phase M1–M3 per PRD milestones; feature flags for whiteboard/polls.

## Decisions → ADRs
- RTK selected as media plane (ADR‑0004).
- Browser compositor for v1 (ADR‑0005).
- Workers + DO control plane (ADR‑0006).
- Simulcast ladder (ADR‑0007).
- WebRTC viewer only (ADR‑0009).
- Cloud backup recorder container (ADR‑0010).

## Unresolved Questions
- Exact DO sharding for very large audiences (out of scope for v1).
