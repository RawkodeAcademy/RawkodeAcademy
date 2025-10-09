# Rawkode Studio v1 — Implementation Plan (Agent‑Executable)

This plan decomposes the v1 scope into small, independent tasks with clear inputs, outputs, files to touch, and acceptance checks. Tasks are grouped by milestones (M0–M3) from the PRD and reference RFCs/ADRs/BDD specs. Agents should pick tasks in order, respecting dependencies.

Conventions
- ID format: `RKS-<milestone>-<stream>-<seq>` (example: `RKS-M1-FE-03`).
- Streams: FE (frontend web), CP (control plane: Workers/DO), MED (media in browser), REC (recording), INF (infrastructure/config), CONT (container recorder), QA (tests/validation), DOC (docs).
- All new code in TypeScript unless specified.
- File paths are relative to repo root.

References
- PRD: `docs/prds/rks-v1-prd.md`
- RFCs: `docs/rfcs/` (see index)
- ADRs: `docs/adrs/` (see index)
- BDD: `docs/features/`

Repo Structure (target)
- `src/` — Astro web app (producer, guest, viewer)
- `workers/` — Cloudflare Workers + Durable Objects
- `packages/` — Shared libraries (protocol, player, media utils)
- `containers/program-recorder/` — Cloud Program Recorder
- `scripts/` — Dev & CI helper scripts

Note: The current app is a minimal Astro project. This plan introduces new folders without moving existing files. Agents should create folders as needed.

Milestones
- M0: Foundations (tooling, env, protocol, database, storage)
- M1: Core live path (producer compositor, simulcast, viewer WebRTC player w/ quality selector)
- M2: Auth + interactivity (guests, comments, polls, raise‑hand, whiteboard)
- M3: Recording (local ISO progressive upload + resume; cloud program recorder)

Readiness Checklist (before any coding)
- Cloudflare account, R2, D1, RTK app available
- Domain(s) chosen (dev OK)
- Atproto OAuth app configured (dev OK)

----------------------------------------
## M0 — Foundations

RKS-M0-INF-01 — Bootstrap workspace config
- Objective: Add basic tooling/commands to work comfortably.
- Prereqs: None
- Steps:
  1) Add `scripts/dev.sh` with `bun dev` wrapper and env loader.
  2) Add `.env.example` with placeholders (see M0-INF-02).
  3) Add `.editorconfig` and Prettier config (or Biome) for TS/MD.
- Deliverables: `scripts/dev.sh`, `.env.example`, `.prettierrc`, `.editorconfig`
- Verify: Repo builds: `bun install && bun dev`.

RKS-M0-INF-02 — Define runtime secrets and env contracts
- Objective: Centralize environment variables.
- Prereqs: None
- Steps:
  1) Create `scripts/env.md` documenting required vars:
     - RTK: `RTK_APP_ID`, `RTK_APP_SECRET`
     - TURN (optional for guests): `TURN_KEY_ID`, `TURN_KEY_API_TOKEN`
     - Cloudflare: `ACCOUNT_ID`, `API_TOKEN`
     - R2: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_RECORDINGS`, `R2_BUCKET_ISO`
     - D1: `D1_DB_NAME`, `D1_BINDING`
     - OAuth: `ATPROTO_CLIENT_ID`, `ATPROTO_CLIENT_SECRET`, `OAUTH_REDIRECT_URI`
     - WS: `COMMENTS_WS_URL`
  2) Add placeholders in `.env.example`.
- Deliverables: `scripts/env.md`, `.env.example`
- Verify: All referenced in later tasks.

RKS-M0-INF-03 — D1 schema v1
- Objective: Create initial SQL schema for shows/sessions/users/manifests.
- Prereqs: None
- Steps:
  1) Create `workers/schema.sql` with tables:
     - `users(id, atproto_did, role, created_at)`
     - `shows(id, title, starts_at, description, created_by, status)`
     - `scenes(id, show_id, name, config_json)`
     - `participants(id, show_id, user_id, role, status)`
     - `sessions(id, show_id, user_id, rtk_session_id, created_at, ended_at)`
     - `tracks(id, show_id, owner_session_id, type, rtk_track_id, created_at, ended_at)`
     - `program_recordings(id, show_id, status, r2_key, created_at, updated_at)`
     - `iso_manifests(id, user_id, show_id, kind, r2_key, status, total_bytes, total_parts, hash, created_at, updated_at)`
     - `iso_parts(id, manifest_id, part_no, bytes, hash, status)`
     - `raise_hands(id, show_id, user_id, status, created_at)`
     - `polls(id, show_id, question, options_json, status, created_at)`
     - `poll_votes(id, poll_id, voter_key, option_idx, created_at)`
  2) Add minimal indexes and foreign keys.
- Deliverables: `workers/schema.sql`
- Verify: D1 migrations apply locally.

RKS-M0-INF-04 — Buckets and paths
- Objective: Define R2 bucket names and key structure.
- Steps:
  1) Create `docs/storage-layout.md` describing keys:
     - Program: `program-recordings/{showId}/program-{timestamp}-{seq}.mp4`
     - ISO: `iso-uploads/{showId}/{userId}/{kind}/part-{partNo}` and `manifest.json`
  2) Note manual retention (per PRD).
- Deliverables: `docs/storage-layout.md`
- Verify: Matches PRD §11 and REC RFC.

RKS-M0-DOC-01 — Protocol and message schemas
- Objective: Define DataChannel payloads and WebSocket inbound events.
- Steps:
  1) Create `packages/protocol/src/types.ts` with zod schemas:
     - `StateDelta`, `SceneUpdate`, `GridUpdate`, `PollOpen`, `PollUpdate`, `CommentPin`, `WhiteboardState`.
  2) Export versioned envelope `{ v, type, ts, seq, roomId, payload }`.
- Deliverables: `packages/protocol/` with build config.
- Verify: Type checks pass.

RKS-M0-CP-01 — Worker/DO bootstrap
- Objective: Scaffold a Worker with a DO for show state.
- Steps:
  1) Create `workers/wrangler.toml` with D1 and R2 bindings, DO class `ShowDO`.
  2) Implement `workers/src/index.ts` routes:
     - `POST /shows` (create), `GET /shows/:id`, `GET /shows/:id/state/snapshot`, `POST /shows/:id/raise-hand`, `POST /polls`, `POST /polls/:id/vote`.
  3) Implement `ShowDO` with in‑memory state + D1 persistence hooks.
- Deliverables: `workers/src/index.ts`, `workers/src/do.ts`, config
- Verify: `wrangler dev` runs; unit tests compile.

RKS-M0-CP-02 — Signed upload URLs (R2)
- Objective: API for multipart ISO uploads.
- Steps:
  1) Endpoints: `POST /uploads/iso/init`, `PUT /uploads/iso/:id/part`, `POST /uploads/iso/:id/complete`, `POST /uploads/iso/:id/abort`.
  2) Validate chunk hashes/sizes; write manifest rows in D1.
- Deliverables: Worker handlers + D1 queries.
- Verify: Happy‑path upload with test client.

----------------------------------------
## M1 — Core Live Path

RKS-M1-MED-01 — Producer simulcast publisher
- Objective: Publish 1080/720/360 H.264 simulcast to RTK.
- Prereqs: M0-CP-01
- Steps:
  1) Create `src/lib/media/publisher.ts` to build `RTCPeerConnection` with `sendEncodings` (RIDs f/h/q).
  2) Use RTK HTTPS API: `sessions/new`, `tracks/new`, `renegotiate` per RFC‑0002.
  3) Configure 2s keyframe, target bitrates per ladder.
- Deliverables: `src/lib/media/publisher.ts`
- Verify: RTK shows 3 layers; viewer can subscribe.

RKS-M1-FE-01 — Viewer WebRTC player (Auto)
- Objective: Minimal viewer that autoselects quality.
- Steps:
  1) Create `src/pages/show/[id]/view.astro`.
  2) Implement `src/lib/player/client.ts` to create RTK session and subscribe to program track.
  3) Render `<video>` with low latency settings.
- Deliverables: routes + player lib
- Verify: First frame ≤ 2s p50.

RKS-M1-FE-02 — Manual quality selector
- Objective: Auto/1080/720/360 menu.
- Steps:
  1) UI component `src/components/QualitySelector.tsx`.
  2) On change, call `/tracks/update preferredRid` (f/h/q).
- Deliverables: component + integration
- Verify: Switch ≤ 2s without disconnect.

RKS-M1-FE-03 — Producer UI shell
- Objective: Basic control room page.
- Steps:
  1) `src/pages/producer/[showId].astro` with panes: preview, scenes, grid, overlays.
  2) Connect to DO snapshot via REST; subscribe to DataChannel for outbound state.
- Deliverables: page + state wiring
- Verify: Scene state persists.

RKS-M1-FE-04 — Dynamic grid layer
- Objective: Add/remove participants to grid.
- Steps:
  1) `src/components/DynamicGrid.tsx` (layout presets: 1,2,3,4,6,8 tiles).
  2) Wire to producer actions; emit `grid.update` deltas.
- Deliverables: component + actions
- Verify: Update propagates to viewers ≤ 200 ms.

RKS-M1-FE-05 — Transitions (blur/crossfade/wipe)
- Objective: Scene transitions at 30 fps.
- Steps:
  1) Implement WebGL/WebCodecs or CSS accelerated transitions.
  2) Ensure transitions don’t break publisher pipeline.
- Deliverables: `src/lib/transitions/*`
- Verify: Smooth @30 fps; no dropped frames noticeable.

RKS-M1-CP-03 — DataChannel broadcaster
- Objective: Producer outbound state via RTK DataChannel.
- Steps:
  1) In publisher, create DataChannel `state-broadcast` reliable/ordered.
  2) Serialize protocol envelopes and send on changes.
- Deliverables: publisher DC integration
- Verify: Viewers/Guests receive updates.

RKS-M1-MED-02 — JIT media assets via Mediabunny
- Objective: Play uploaded video/audio assets in scenes with precise end events.
- Steps:
  1) Use Mediabunny demux/decoder to feed frames/audio to compositor.
  2) Emit `onEnd` when stream completes to trigger auto scene switch.
- Deliverables: `src/lib/media/assets.ts`
- Verify: Holding video triggers scene change reliably.

----------------------------------------
## M2 — Auth + Interactivity

RKS-M2-INF-01 — atproto OAuth integration
- Objective: Sign‑in for Producer/Guests.
- Steps:
  1) Add auth routes `/auth/login`, `/auth/callback`, `/auth/logout`.
  2) Store users in D1; set roles; session cookie.
- Deliverables: `src/pages/auth/*`, `src/lib/auth.ts`
- Verify: Producer dashboard gated; guests reach green room.

RKS-M2-MED-01 — Guest publish + return
- Objective: Guests publish cam/mic; receive program video + SFU audio.
- Steps:
  1) Guest page `src/pages/guest/[showId].astro`.
  2) Publish tracks to RTK; subscribe to others’ audio (no program audio); subscribe to program video muted.
- Deliverables: guest page + media code
- Verify: Meet‑like FX; no echo.

RKS-M2-CP-01 — Raise‑hand flow
- Objective: Auth viewers request promotion; producer approves.
- Steps:
  1) Endpoints: `POST /shows/:id/raise-hand`, `POST /shows/:id/raise-hand/:reqId/approve|reject`.
  2) DO updates participants and grants publish permissions.
- Deliverables: Worker handlers + UI in producer
- Verify: Promotion within 5s per BDD.

RKS-M2-FE-01 — Comments ingestion (WebSocket)
- Objective: Show mod queue and on‑stream pin.
- Steps:
  1) Connect to `COMMENTS_WS_URL` in DO; validate auth for posting.
  2) Producer UI to pin/unpin; broadcast overlays via DataChannel.
- Deliverables: DO WS client; UI components
- Verify: Pinned comment renders on program.

RKS-M2-FE-02 — Polls (anonymous voting)
- Objective: Open/close polls; count anonymous votes.
- Steps:
  1) DO endpoints for poll CRUD and vote (rate‑limit per browser session).
  2) Viewer UI for voting; deltas broadcast for results.
- Deliverables: Worker routes; UI components
- Verify: Results update ≤ 500 ms.

RKS-M2-FE-03 — RTK Whiteboard plugin
- Objective: Enable whiteboard and composite in program.
- Steps:
  1) Load RTK whiteboard plugin per show.
  2) Render layer in program when active.
- Deliverables: plugin wiring; program compositor layer
- Verify: Drawings visible to viewers.

----------------------------------------
## M3 — Recording

RKS-M3-REC-01 — Local ISO capture
- Objective: Per‑participant Camera/Audio/Screenshare local record.
- Steps:
  1) `src/lib/recording/local.ts` using Mediabunny + WebCodecs (preferred) with fallback to `MediaRecorder`.
  2) Implement canEncode checks (H.264 → MP4 if possible; else VP9/Opus → WebM). High bitrates; support 4K30 where hardware allows.
  3) Start on join; stop on leave; optional segmenting.
- Deliverables: recording lib
- Verify: Files accumulate locally.

RKS-M3-REC-02 — Progressive multipart upload to R2
- Objective: Upload chunks during session.
- Steps:
  1) Chunk 8–32 MB; compute SHA‑256; write manifest (OPFS/IndexedDB). Where possible, align chunk boundaries to keyframes using Mediabunny timing.
  2) Call Worker endpoints to init/put/complete; store part numbers in D1.
- Deliverables: uploader lib `src/lib/recording/upload.ts`
- Verify: Parts visible in R2; manifest row written.

RKS-M3-REC-03 — Resume after crash/close (≤ 7 days)
- Objective: Robust resume logic.
- Steps:
  1) On app load, scan OPFS/IndexedDB manifests; re‑auth; query DO for pending uploads.
  2) Resume missing parts; verify hashes; complete.
- Deliverables: resume flow in uploader lib
- Verify: BDD “Resume upload” passes.

RKS-M3-CONT-01 — Cloud Program Recorder container
- Objective: Subscribe to program track; write MP4 to R2.
- Steps:
 1) Create `containers/program-recorder/` in Go (Pion) or Rust (webrtc-rs). These are the preferred implementations.
  2) Implement: fetch program track ID + ICE servers from DO; join RTK; remux H.264 Annex‑B to MP4; transcode Opus→AAC 256 kbps (FFmpeg/libav or GStreamer bindings appropriate to the language).
  3) Segment every 5–10 min; upload to `program-recordings/{showId}/`.
- Deliverables: container code + `Dockerfile`
- Verify: MP4 appears in R2 during show; final file ready ≤ 5 min after end.

RKS-M3-CP-01 — Recorder orchestration
- Objective: Start/stop container per show.
- Steps:
  1) Worker route `POST /shows/:id/recorders/start|stop`.
  2) Store status in D1.
- Deliverables: Worker handlers
- Verify: Recorder lifecycle controllable from Producer UI.

----------------------------------------
## Cross‑Cutting

RKS-CC-QA-01 — Map BDD specs to checks
- Objective: Implement lightweight e2e harness to exercise features.
- Steps:
  1) Parse `docs/features/*.feature` and map steps to Playwright flows where feasible.
  2) Add CI jobs for smoke scenarios.
- Deliverables: `tests/e2e/*`
- Verify: Critical paths green.

RKS-CC-SEC-01 — Secrets handling
- Objective: Ensure secrets never leak client‑side.
- Steps:
  1) Only Worker holds RTK app secret and TURN key API token.
  2) Browser receives short‑lived ICE servers and session tokens.
- Deliverables: Code audits; unit tests
- Verify: No secrets in client bundles.

RKS-CC-OBS-01 — Basic telemetry
- Objective: Logs/metrics for DO state, upload errors, viewer QoE.
- Steps:
  1) Add structured logs; error counters; simple health endpoint.
- Deliverables: Logging utilities
- Verify: Dash shows key events.

----------------------------------------
## Handover Template (per task)

When an agent completes a task, include in the PR:
- Summary: What changed and why
- Files touched (paths)
- Manual test notes / screenshots
- Links: RFC/ADR/BDD items satisfied
- Follow‑ups: Next dependent tasks unblocked

Definition of Done (per task)
- Compiles/lints; no secrets in client code; docs updated if new config introduced; acceptance checks in task verified.

Risk Notes
- Browser codec variance: prefer WebM locally; expose fallback flags.
- Producer performance: document recommended machine/network in `docs/README.md`.

Appendix: RTK HTTPS endpoints used (reference)
- `POST /apps/{appId}/sessions/new`
- `POST /apps/{appId}/sessions/{sessionId}/tracks/new`
- `PUT  /apps/{appId}/sessions/{sessionId}/renegotiate`
- `PUT  /apps/{appId}/sessions/{sessionId}/tracks/close`
- `GET  /apps/{appId}/sessions/{sessionId}`

End of plan.
