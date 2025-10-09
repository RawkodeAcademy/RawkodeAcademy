---
title: "Use producer‑browser compositor for v1"
status: Accepted
date: 2025-10-09
deciders: [Product, Engineering]
consulted: [Media]
informed: [All]
supersedes: []
superseded_by: null
---

## Context
We must ship quickly with robust scene control while keeping latency low. Cloud compositors increase complexity and infra.

## Decision
Compose the program in the producer’s Chrome browser. Publish simulcast program to RTK. Plan for a future cloud mixer but not in v1.

## Consequences
- Pros: Faster to ship, minimal infra, direct scene control.
- Cons: Producer machine and uplink become the bottleneck.

## References
- RFC‑0001 Architecture
- RFC‑0006 Scenes, Dynamic Grid & Transitions

