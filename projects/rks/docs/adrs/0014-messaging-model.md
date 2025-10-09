---
title: "Messaging split: RTK DataChannel outbound, WebSocket inbound"
status: Accepted
date: 2025-10-09
deciders: [Engineering]
consulted: [Product]
informed: [All]
supersedes: []
superseded_by: null
---

## Context
We need instant outbound state fan‑out and a flexible inbound integration for comments/polls/raise‑hand.

## Decision
Outbound producer state via RTK DataChannel (unidirectional broadcast). Inbound via provided WebSocket → DO → rebroadcast as state deltas.

## Consequences
- Pros: Minimal latency for viewers; decoupled inbound integrations.
- Cons: Client resync logic required on reconnect.

## References
- RFC‑0007 Messaging

