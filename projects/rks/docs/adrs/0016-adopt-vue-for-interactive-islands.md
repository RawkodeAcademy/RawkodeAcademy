---
title: "Adopt Vue for interactive islands (prefer Vue over React)"
status: Accepted
date: 2025-10-10
deciders: [Engineering]
consulted: [Product]
informed: [All]
supersedes: []
superseded_by: null
---

## Context

We use Astro for the web frontend (ADR‑0002). For interactive UI, Astro supports multiple island frameworks. Early v1 tasks require tabs, selects, menus, and small control panels in the Producer and Viewer surfaces. We must choose a primary island framework to keep component libraries, examples, and code patterns consistent.

Constraints and inputs:
- Ark UI will be our headless/component primitives library. It provides first‑class Vue and React packages.
- Team preference leans toward template‑driven authoring and Composition API.
- Our runtime is Bun (see AGENTS.md), and we want minimal complexity in tooling.

## Decision

Prefer Vue over React for interactive islands within Astro.

Guidelines:
- Use `@astrojs/vue` for integration and `@ark-ui/vue` for headless UI components.
- New UI components (e.g., QualitySelector, Producer tabs) should be authored in Vue SFCs.
- React is not banned; it may be used for isolated, third‑party widgets where Vue is unavailable. Default choice is Vue.

## Consequences

Pros
- Concise SFC + template syntax and Composition API suit our UI patterns.
- Ark UI’s Vue package gives parity with React and stable primitives.
- Smooth Astro islands integration; fewer hydration surface areas than a full SPA.

Cons
- Some ecosystem libraries are React‑first; occasional wrappers may be needed.
- Team members more familiar with React need a short ramp‑up on Vue idioms.

## Alternatives Considered

- React islands: viable with Ark UI React, larger community; deprioritized to align with team preference and current component plans.
- Web Components only: avoids framework lock‑in but increases authoring overhead for complex state.

## References

- ADR‑0002 Adopt Astro for web frontend
- Ark UI documentation: Vue packages for tabs/select and related primitives
- AGENTS.md: Bun as the JS runtime and package manager

