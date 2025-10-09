---
title: "Adopt Mediabunny for client-side media I/O"
status: Accepted
date: 2025-10-09
deciders: [Media, Engineering]
consulted: [Product]
informed: [All]
supersedes: []
superseded_by: null
---

## Context
We need high‑quality, controllable client‑side recording and reliable handling of JIT media assets in the browser. The default `MediaRecorder` API is simple but opaque (codec selection, rate control, segmenting, metadata), and behavior varies across platforms. Mediabunny is a TypeScript media toolkit built for the web that provides demux/mux and WebCodecs‑backed encode/decode with progressive writing and streaming I/O.

## Decision
Use Mediabunny in the browser for:
- Local ISO recording: encode via WebCodecs where available and write WebM/MP4 progressively; fall back to MediaRecorder when WebCodecs/codec unsupported.
- JIT media assets: demux/decoding of uploaded video/audio for scenes (e.g., Holding), with precise end‑of‑media signaling to drive auto scene switching.

Do not use Mediabunny for WebRTC transport (RTK handles that) or the cloud program recorder (Go/Rust).

## Consequences
- Pros: More control over codecs/bitrates/containers, deterministic chunking, integrity verification, and better metadata handling.
- Cons: Slightly higher implementation complexity than `MediaRecorder`; codec availability depends on browser (offer fallbacks).

## References
- RFC‑0004 Local ISO Recording & Progressive Uploads
- RFC‑0006 Scenes, Dynamic Grid & Transitions

