---
title: "Select Cloudflare Realtime (RTK) as media plane"
status: Accepted
date: 2025-10-09
deciders: [Engineering]
consulted: [Product]
informed: [All]
supersedes: []
superseded_by: null
---

## Context
We need a globally distributed SFU with low latency, simple HTTPS control APIs, DataChannels, and TURN/STUN. We want to avoid running and scaling our own SFU.

## Decision
Adopt Cloudflare Realtime (RTK) for SFU/DataChannels with Workers/DO control plane integration.

## Consequences
- Pros: Global anycast, low ops, straightforward HTTPS API, TURN service, DataChannels.
- Cons: Vendor dependency; we design our own room/presence layer.

## References
- RFC‑0001 High‑Level Architecture

