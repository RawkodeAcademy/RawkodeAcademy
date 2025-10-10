---
title: "Adopt Drizzle ORM for Cloudflare D1"
status: Accepted
date: 2025-10-10
deciders: [Engineering]
consulted: [Platform]
informed: [All]
supersedes: []
superseded_by: null
---

## Context

We persist control-plane state in Cloudflare D1 (SQLite). Initial prototypes used raw SQL (`env.DB.prepare`) in Workers and DOs. As v1 grows (uploads, polls, participants, manifests), we need:

- Typed schemas and query safety.
- Cross-file reuse of table definitions.
- Composable updates (e.g., atomic counters) and clearer migrations alongside our existing `control-plane/schema.sql`.

## Decision

Use Drizzle ORM with the D1 driver (`drizzle-orm/d1`) and SQLite schema module (`drizzle-orm/sqlite-core`).

Guidelines:
- Define tables in `control-plane/src/db/schema.ts` and export them for reuse.
- Create a lightweight `getDb(env)` helper in `control-plane/src/db/client.ts`.
- Prefer Drizzle APIs over raw `env.DB.prepare` for reads/writes; use `sql``...`` for arithmetic updates.
- Keep `control-plane/schema.sql` as the authoritative DDL; Drizzle schema mirrors the table shape for typing.

## Consequences

Pros
- Strong typing across queries, fewer shape mismatches.
- Centralized schema definitions; easier refactors.
- Cleaner code in Workers/DO, safer updates.

Cons
- Introduces an extra dependency and schema duplication (DDL + Drizzle).
- Some complex queries may still use raw SQL via `sql` tagged template.

## Alternatives Considered

- Raw `env.DB.prepare` only — minimal deps but error-prone and scattered SQL.
- Kysely — also viable; Drizzle has first-class D1 adapter and small API surface we need.

## References

- `control-plane/schema.sql` — authoritative DDL
- Cloudflare D1 docs; Drizzle ORM D1 adapter docs
