---
title: WebRTC Viewer Player & Quality Selection
status: Draft
created: 2025-10-09
owner: Frontend
reviewers: [Media]
review_window: 2025-10-09 → 2025-10-16
---

## Summary
Implement a WebRTC viewer using RTK sessions. Provide Auto/1080/720/360 manual selector; default Auto. Mobile (iOS/Android) supported.

## Behavior
- Auto: subscribe to program track with no `preferredRid`; RTK selects.
- Manual: call `/tracks/update` with `preferredRid` to f/h/q.
- Show overlays/comments/polls via DataChannel state.

## Latency Targets
- First frame ≤ 2 s p50; glass‑to‑glass ≤ 2 s p50 / ≤ 5 s p95.

## Errors & Reconnect
- Rebuild session on `connectionstatechange=failed`; fetch snapshot; resume deltas.

