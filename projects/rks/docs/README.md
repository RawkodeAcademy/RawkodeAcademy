# Project Documentation

This repository follows a “docs‑as‑code” approach. Planning and decision‑making live alongside the code in `docs/` and drive implementation.

## Structure

- `docs/adrs/` — Architecture Decision Records (ADRs)
- `docs/rfcs/` — Request for Comments proposals
- `docs/prds/` — Product Requirements Documents
- `docs/features/` — BDD feature files (Gherkin)

## Naming & Status

- Numbered files use zero‑padded integers: `0001-meaningful-title.md`.
- Common statuses: `Proposed`, `Accepted`, `Rejected`, `Superseded`, `Deprecated`.
- Dates are ISO (YYYY-MM-DD). Current date: 2025-10-09.

## Authoring Workflow

1. Start with an RFC for any non-trivial change.
2. When the team makes a decision, capture it in an ADR and link the RFC.
3. Keep the PRD as the single source of truth for scope, outcomes, and success metrics.
4. Derive BDD `.feature` files from PRD user stories; keep them living specs.

## Conventions

- One decision per ADR; never edit history — supersede instead.
- RFCs are time‑boxed; each has an explicit review window and owner.
- PRDs focus on outcomes and measurable success criteria over implementation detail.
- Gherkin features should be human‑readable and automatable.

## Templates

- ADR: `docs/adrs/_template.md`
- RFC: `docs/rfcs/_template.md`
- PRD: `docs/prds/_template.md`
- Feature: `docs/features/_template.feature`

## Starting Points

- PRD: `docs/prds/rks-v1-prd.md`
- RFC Index: `docs/rfcs/README.md`
- ADR Index: `docs/adrs/README.md`
- Feature Specs: `docs/features/README.md`

## Links Between Docs

- RFCs reference related ADRs with “Decisions” and ADRs reference RFCs in “Context”.
- PRDs link to RFCs (solution direction) and Features (acceptance criteria).

## Review & Change Control

- Open a PR for any change to docs.
- Tag reviewers per doc type (e.g., product for PRD, engineering for RFC/ADR).
- Use `Superseded-By` and `Supersedes` fields to maintain traceability.
