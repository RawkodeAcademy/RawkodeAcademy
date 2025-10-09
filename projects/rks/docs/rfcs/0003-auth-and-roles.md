---
title: Authentication & Roles (atproto + Better Auth)
status: Draft
created: 2025-10-09
owner: Platform
reviewers: [Product, Security]
review_window: 2025-10-09 → 2025-10-16
---

## Summary
Use atproto OAuth with Better Auth. Roles: Producer (single), Guest (authenticated), Viewer (public). Only authenticated users can comment, raise hand, or join stage; polls allow anonymous votes.

## Flows
- Producer/Guest sign‑in → session cookie/JWT. CSRF protected.
- Viewer: anonymous cookie for analytics; optional soft auth for vote rate‑limits.
- Raise‑hand: Auth required; DO enforces one active request per user.

## Permissions
- Producer: Full scene/grid control, approve promotions, publish program, start/stop show.
- Guest: Publish A/V, receive program video + SFU audio.
- Viewer: Watch stream; vote in polls; no comments unless authenticated.

## Data
- D1 tables: users, identities, roles, sessions, shows, membership.

## Security
- Short‑lived tokens; refresh on rotation; revoke on logout.

