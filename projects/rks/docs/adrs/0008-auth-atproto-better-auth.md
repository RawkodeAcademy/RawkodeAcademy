---
title: "Authentication via atproto OAuth (Better Auth)"
status: Accepted
date: 2025-10-09
deciders: [Platform]
consulted: [Security]
informed: [All]
supersedes: []
superseded_by: null
---

## Context
We need simple, standard sign‑in for producer/guests and optional identification for viewers.

## Decision
Use atproto OAuth with Better Auth for Producer and Guest authentication. Viewers remain public; some actions gated.

## Consequences
- Pros: Standards‑based, good developer ergonomics.
- Cons: Adds dependency on atproto/OAuth availability.

## References
- RFC‑0003 Authentication & Roles

