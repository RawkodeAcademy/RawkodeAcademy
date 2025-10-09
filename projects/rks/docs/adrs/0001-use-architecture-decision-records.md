---
title: "Use Architecture Decision Records"
status: Accepted
date: 2025-10-09
deciders: [Engineering]
consulted: [Product]
informed: [All]
supersedes: []
superseded_by: null
---

## Context

Decisions about architecture are scattered and often lost in PRs or chat threads, making it hard to understand why choices were made.

## Decision

We will record significant engineering decisions as ADRs in `docs/adrs/`, one decision per file, numbered and immutable.

## Consequences

- Pros: Traceability, onboarding clarity, shared understanding.
- Cons: Adds small process overhead.

## Alternatives Considered

- Only use RFCs — lacks final, durable decision artifact.
- Inline README notes — hard to discover across the codebase.

## References

- Related RFC(s): N/A

