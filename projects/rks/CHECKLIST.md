# Rawkode Studio v1 — Execution Checklist

Use this checklist to coordinate agents. Flip `[ ]` to `[x]` when done and fill metadata.

Update rules
- Never delete items; append notes if scope changes.
- Each item should include Assignee, PR (path or URL), and Done (YYYY-MM-DD).
- Keep items ordered; status is the single source of truth for progress.

Docs seed (completed)
- [x] PRD v1 drafted — docs/prds/rks-v1-prd.md — Assignee: system — PR: n/a — Done: 2025-10-09
- [x] RFCs 0001–0008 drafted — docs/rfcs/ — Assignee: system — PR: n/a — Done: 2025-10-09
- [x] ADRs 0004–0014 accepted — docs/adrs/ — Assignee: system — PR: n/a — Done: 2025-10-09
- [x] BDD features added — docs/features/ — Assignee: system — PR: n/a — Done: 2025-10-09

## M0 — Foundations
- [x] RKS-M0-INF-01 — Bootstrap workspace config — Assignee: gpt-5-codex — PR: (this PR) — Done: 2025-10-10
- [x] RKS-M0-INF-02 — Define runtime secrets and env contracts — Assignee: gpt-5-codex — PR: (this PR) — Done: 2025-10-10
- [x] RKS-M0-INF-03 — D1 schema v1 — Assignee: gpt-5-codex — PR: (this PR) — Done: 2025-10-10
- [x] RKS-M0-INF-04 — Buckets and paths — Assignee: gpt-5-codex — PR: (this PR) — Done: 2025-10-10
- [x] RKS-M0-DOC-01 — Protocol and message schemas — Assignee: gpt-5-codex — PR: (this PR) — Done: 2025-10-10
- [x] RKS-M0-CP-01 — Worker/DO bootstrap — Assignee: gpt-5-codex — PR: (this PR) — Done: 2025-10-10
- [x] RKS-M0-CP-02 — Signed upload URLs (R2) — Assignee: gpt-5-codex — PR: (this PR) — Done: 2025-10-10

## M1 — Core Live Path
- [ ] RKS-M1-MED-01 — Producer simulcast publisher — Assignee: gpt-5-codex — PR: (this PR) — Done:  
  Notes: addTransceiver(sendEncodings) + RTK negotiate via Worker wired; validating on real RTK.
- [ ] RKS-M1-FE-01 — Viewer WebRTC player (Auto) — Assignee: gpt-5-codex — PR: (this PR) — Done:  
  Notes: minimal viewer + Green Room subscriber; quality auto for now.
- [ ] RKS-M1-FE-02 — Manual quality selector — Assignee: gpt-5-codex — PR: (this PR) — Done:
- [ ] RKS-M1-FE-03 — Producer UI shell — Assignee: gpt-5-codex — PR: (this PR) — Done:  
  Notes: Ark UI Device Setup, live mic badge, fallback preview, “Open Session/Close Session” controls; scenes/grid pending.
- [ ] RKS-M1-FE-04 — Dynamic grid layer — Assignee: — PR: — Done:
- [ ] RKS-M1-FE-05 — Transitions (blur/crossfade/wipe) — Assignee: — PR: — Done:
- [ ] RKS-M1-CP-03 — DataChannel broadcaster — Assignee: gpt-5-codex — PR: (this PR) — Done:

- [x] RKS-M1-CP-04 — RTK HTTP proxy endpoints — Assignee: gpt-5-codex — PR: (this PR) — Done: 2025-10-10  
  Notes: /rtk/create-session, /rtk/sessions/:id/tracks/new, /rtk/program/:sessionId; CORS; Secret Store + 1Password direnv.

## M2 — Auth + Interactivity
- [ ] RKS-M2-INF-01 — atproto OAuth integration — Assignee: — PR: — Done:
- [ ] RKS-M2-MED-01 — Guest publish + return — Assignee: gpt-5-codex — PR: (this PR) — Done:  
  Notes: Green Room shows Program Mix + device setup; guest publish wiring next.
- [ ] RKS-M2-CP-01 — Raise‑hand flow — Assignee: — PR: — Done:
- [ ] RKS-M2-FE-01 — Comments ingestion (WebSocket) — Assignee: — PR: — Done:
- [ ] RKS-M2-FE-02 — Polls (anonymous voting) — Assignee: — PR: — Done:
- [ ] RKS-M2-FE-03 — RTK Whiteboard plugin — Assignee: — PR: — Done:

## M3 — Recording
- [x] RKS-M3-REC-01 — Local ISO capture — Assignee: gpt-5-codex — PR: (this PR) — Done: 2025-10-10
- [x] RKS-M3-REC-02 — Progressive multipart upload to R2 — Assignee: gpt-5-codex — PR: (this PR) — Done: 2025-10-10
- [ ] RKS-M3-REC-03 — Resume after crash/close (≤ 7 days) — Assignee: — PR: — Done:
- [ ] RKS-M3-CONT-01 — Cloud Program Recorder container — Assignee: — PR: — Done:
- [ ] RKS-M3-CP-01 — Recorder orchestration — Assignee: — PR: — Done:

## Cross‑Cutting
- [ ] RKS-CC-QA-01 — Map BDD specs to checks — Assignee: — PR: — Done:
- [ ] RKS-CC-SEC-01 — Secrets handling — Assignee: — PR: — Done:
- [ ] RKS-CC-OBS-01 — Basic telemetry — Assignee: — PR: — Done:

Notes
- Task IDs and details are defined in PLAN.md. If an item needs re‑scoping, update both PLAN.md and this checklist.
