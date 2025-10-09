---
title: "Adopt Astro for web frontend"
status: Accepted
date: 2025-10-09
deciders: [Engineering]
consulted: [Product]
informed: [All]
supersedes: []
superseded_by: null
---

## Context

This repository is initialized with Astro. We need to confirm Astro as the framework for the web frontend based on our goals of fast content sites, good DX, and partial hydration when needed.

## Decision

Use Astro as the primary framework for the web frontend and content site, with islands/partial hydration for interactive components as needed.

## Consequences

- Pros: Excellent performance defaults, simple content routing, flexible integration with frameworks.
- Cons: Team needs shared Astro familiarity; patterns for complex interactivity must be documented.

## Alternatives Considered

- Next.js/React — strong ecosystem but heavier by default for content‑first sites.
- Static site generator only — may limit future interactivity.

## References

- Related RFC(s): 0001-content-architecture-and-routing

