---
title: "Model split: Show (static), Session (sched/adhoc), Instant Studio"
status: Accepted
date: 2025-10-10
deciders: [Engineering]
consulted: [Product]
informed: [All]
supersedes: []
superseded_by: null
---

## Context

We need a clear separation between a long‑lived Show (series metadata), a time‑bound Session (an occurrence you schedule or run), and an ad‑hoc Instant Studio (start now, optionally not tied to a show). Early prototypes conflated scheduling with the Show object.

## Decision

- Show: static series metadata (title, description, owner). No schedule or live status.
- Session: a single occurrence with lifecycle (draft → scheduled → live → ended/cancelled). May be linked to a Show (optional) and is the unit of production state (grid, scenes, raise‑hands, polls, tracks).
- Instant Studio: an ad‑hoc Session (no prior scheduling). Can be linked to a Show or stand‑alone.

Implementation notes (v1):
- Durable Object scope is per Session (not per Show).
- Control plane and Producer UI should address Sessions by `sessionId`.
- Keep existing D1 schema; we’ll extend as needed. For now, we use `sessions` for creation and state, and keep Show unchanged for compatibility.

## Consequences

Pros
- Cleaner lifecycle: archive shows independently, manage live state per session.
- Enables one‑click Instant Studio without polluting Show metadata.

Cons
- Requires new routes/pages addressing sessions.
- DO and some endpoints need migration from `showId` to `sessionId`.

## Migration

Phase 1 (this PR):
- Add Session DO and `/sessions/*` endpoints alongside existing `/shows/*`.
- Producer UI gains `/producer/session/:sessionId` route; keep `/producer/:showId` for now.

Phase 2:
- Move all stateful operations to session‑scoped endpoints and retire show‑scoped ones.

