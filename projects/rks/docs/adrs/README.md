# Architecture Decision Records (ADRs)

ADRs capture significant, long‑lived technical decisions. Keep each ADR immutable; supersede rather than rewrite.

## How to add a new ADR

1. Copy `_template.md` to the next number: e.g., `0004-new-decision.md`.
2. Fill fields, propose via PR, request review from engineering.
3. When accepted, set `status: Accepted` and merge.

## Index

- 0001 — Use Architecture Decision Records
- 0002 — Adopt Astro for web frontend
- 0003 — Adopt Docs‑as‑Code in repo
- 0004 — Select Cloudflare Realtime (RTK) as media plane
- 0005 — Use producer‑browser compositor for v1
- 0006 — Workers + Durable Objects for control plane
- 0007 — Program simulcast ladder (1080/720/360)
- 0008 — Authentication via atproto OAuth (Better Auth)
- 0009 — Public viewer path is WebRTC only (no HLS)
- 0010 — Cloud backup program recording to R2
- 0011 — Local ISO recording (WebM) with progressive upload to R2
- 0012 — Guest return = program video only; guests hear others via SFU audio
- 0013 — Supported environments for v1
- 0014 — Messaging split: RTK DataChannel outbound, WebSocket inbound
- 0015 — Adopt Mediabunny for client-side media I/O
- 0016 — Adopt Vue for interactive islands (prefer Vue over React)
- 0017 — Adopt Drizzle ORM for Cloudflare D1
- 0018 — Model split: Show (static), Session (sched/adhoc), Instant Studio
