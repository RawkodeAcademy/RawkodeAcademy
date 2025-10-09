---
title: Messaging — RTK DataChannel (outbound) + WebSocket (inbound)
status: Draft
created: 2025-10-09
owner: Platform
reviewers: [Frontend]
review_window: 2025-10-09 → 2025-10-16
---

## Summary
Outbound realtime state (scenes, overlays, polls) is broadcast from Producer via RTK DataChannel (unidirectional) to all clients. Inbound events (comments, votes, raise‑hand) arrive via a provided WebSocket, are authenticated/aggregated in DO, and rebroadcast as state deltas.

## Payload
`{ v, type, ts, seq, roomId, payload }`
- Types: `scene.update`, `grid.update`, `overlay.pin`, `poll.open`, `poll.update`, `comment.pin`, `whiteboard.state`, etc.
- Reliable/ordered for state deltas; unreliable/unordered allowed for high‑frequency cursors.

## Resync
- On reconnect, clients GET `/state/snapshot` from DO (ETag=last seq), then resume deltas.

## Limits
- Rate limit inbound events per user/IP; collapse duplicate votes; moderation hooks for comments.

