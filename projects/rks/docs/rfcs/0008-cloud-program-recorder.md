---
title: Cloud Program Recorder (Container) → R2 MP4
status: Draft
created: 2025-10-09
owner: Media/Infra
reviewers: [Engineering]
review_window: 2025-10-09 → 2025-10-16
---

## Summary
Run a per‑show Cloudflare Container that subscribes to the program track via RTK and writes an MP4 (1080p30 H.264/AAC) to R2 as a backup recording.

## Design
- The container boots with show ID; fetches program track ID and ICE servers from DO; creates RTK session; pulls program video+audio.
- Implement WebRTC with Pion (Go) or webrtc‑rs (Rust). Remux H.264 Annex‑B to MP4 (length‑prefixed) and transcode Opus→AAC @ 256 kbps (FFmpeg/libav or GStreamer bindings).
- Segment‑roll MP4 (e.g., 5–10 min) to tolerate restarts; upload to `sessions/{sessionId}/program/` and write a playlist/manifest in the single media bucket.

## Resilience
- On container restart or network churn, rejoin RTK and continue recording; segments are idempotent by timestamp.

## Retention
- Manual cleanup (no auto‑delete).
