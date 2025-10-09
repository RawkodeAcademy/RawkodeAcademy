---
title: "Workers + Durable Objects for control plane"
status: Accepted
date: 2025-10-09
deciders: [Engineering]
consulted: [Product]
informed: [All]
supersedes: []
superseded_by: null
---

## Context
RTK has no rooms; we need presence, permissions, manifests, and orchestration with low latency.

## Decision
Implement the control plane on Cloudflare Workers and Durable Objects (DO) for stateful coordination per show/session.

## Consequences
- Pros: Low latency across regions, good fit with RTK, simple ops.
- Cons: Requires careful sharding for future large audiences.

## References
- RFC‑0001 Architecture

