---
title: "Adopt docs-as-code in repo"
status: Accepted
date: 2025-10-09
deciders: [Product, Engineering]
consulted: [All]
informed: [All]
supersedes: []
superseded_by: null
---

## Context

To keep product and engineering aligned, we want planning artifacts (PRDs, RFCs, ADRs, BDD specs) versioned with code.

## Decision

Maintain PRDs, RFCs, ADRs, and `.feature` files under `docs/`. Treat them as first‑class code with PR review and traceability.

## Consequences

- Pros: Single source of truth; changes are reviewed and auditable.
- Cons: Requires discipline to keep docs current.

## References

- Related RFC(s): N/A

