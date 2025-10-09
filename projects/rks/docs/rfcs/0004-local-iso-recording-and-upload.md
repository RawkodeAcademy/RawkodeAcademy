---
title: Local ISO Recording & Progressive Uploads to R2
status: Draft
created: 2025-10-09
owner: Media
reviewers: [Platform]
review_window: 2025-10-09 → 2025-10-16
---

## Summary
Record per‑participant ISO (camera, mic, screenshare) locally in the browser and upload progressively to R2 with 7‑day resume. Use Mediabunny with WebCodecs for controlled encode/mux where supported; fall back to `MediaRecorder` if needed. Prioritize quality; default to WebM (VP9/Opus). Attempt H.264 where available.

## Recording Strategy
- Use Mediabunny capture pipelines per track to ingest camera/mic/screenshare, encode via WebCodecs, and mux to WebM/MP4 progressively.
- Fallback: `MediaRecorder` when WebCodecs/codec unavailable.
- Suggested bitrates: camera 35–50 Mbps, screenshare 8–20 Mbps, audio 256 kbps.
- Chunking: 8–32 MB segments; hash each chunk; write manifest.

## Upload Strategy
- R2 multipart uploads via signed URLs from DO; idempotent chunk PUTs by `partNumber`.
- Persist local state in OPFS/IndexedDB: manifest, chunk map, last uploaded part, SHA‑256.
- Resume by re‑auth within 7 days; continue pending parts; finalize multipart when complete.

## Integrity
- DO verifies chunk hashes and sizes against manifest; rejects mismatches; supports re‑upload.

## Privacy & Failure Modes
- Nothing leaves device until user joins recording; on crash/close, resume on next sign‑in within 7 days.
