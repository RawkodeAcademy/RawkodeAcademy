---
title: "Public viewer path is WebRTC only (no HLS)"
status: Accepted
date: 2025-10-09
deciders: [Product, Media]
consulted: [Engineering]
informed: [All]
supersedes: []
superseded_by: null
---

## Context
We target minimal latency for viewers. HLS introduces higher delay.

## Decision
Ship a WebRTC viewer with Auto/1080/720/360 selection. No HLS/m3u8 in v1.

## Consequences
- Pros: Lowest latency; single media pipeline.
- Cons: No long‑tail CDN caching; higher per‑viewer egress.

## References
- RFC‑0005 WebRTC Viewer Player & Quality

