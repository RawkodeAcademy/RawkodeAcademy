# Agent Guide — Rawkode Studio

Scope: entire repo.

Purpose: Coordinate multiple agents implementing v1. Use PLAN.md for task details and CHECKLIST.md to track progress.

Read Before You Start (Required)
- Skim PRD v1: `docs/prds/rks-v1-prd.md` to understand scope and success criteria.
- Review ADR index: `docs/adrs/README.md`. Pay special attention to:
  - 0002 — Adopt Astro for web frontend (Astro islands model)
  - 0016 — Adopt Vue for interactive islands (prefer Vue over React)
  - 0006 — Workers + Durable Objects for control plane
  - 0004 — Select Cloudflare Realtime (RTK) as media plane
  - 0015 — Adopt Mediabunny for client-side media I/O
  - 0007 — Program simulcast ladder; 0009 — Viewer is WebRTC-only; 0010 — Cloud program recording
- Open RFC index: `docs/rfcs/README.md` and read the RFC(s) relevant to your task/milestone.
- Check `PLAN.md` steps for your task ID and verify dependencies, deliverables, and acceptance checks.
- Confirm env contracts in `scripts/env.md`; do not introduce new envs without documenting them.
  - Progressive upload flag: `PUBLIC_RKS_PROGRESSIVE_UPLOAD` (default `false`). Keep `false` in local dev to store recordings locally; set `true` for environments where Worker uploads are desired.

Tooling & Runtime (Bun, not npm/node)
- Use Bun as the JavaScript runtime and package manager.
- Commands:
  - Install deps: `bun install`
  - Dev server: `bun dev`
  - Build: `bun build`
  - Preview: `bun preview`
  - Astro CLI: `bun astro <cmd>`
  - Cloudflare Wrangler: `bunx wrangler <cmd>` (no `npx`/`npm run`)
- Add/remove deps with `bun add <pkg>` / `bun remove <pkg>`.
- Do NOT use npm/yarn/pnpm; do NOT commit `package-lock.json`/`yarn.lock`/`pnpm-lock.yaml`.
- ESM only (`"type": "module"`).
- Container recorder: Go (Pion) or Rust (webrtc-rs) preferred. If a JS fallback is ever used, use Bun in the container (`FROM oven/bun:1`), but Go/Rust is the default.

How to Work
- Choose one open item from `CHECKLIST.md` and claim it by adding your handle to “Assignee”.
- Implement per steps in `PLAN.md` (match the task ID).
- Keep changes minimal and focused on the task.
- Update docs if you introduce new env vars or endpoints.
- Respect ADRs. If your work would change an accepted decision, propose a new ADR that supersedes it before coding.
- UI policy: Prefer Vue islands with Ark UI.
  - Use `@astrojs/vue` and `@ark-ui/vue` for interactive components (Tabs, Select, etc.).
  - Use the Ark UI MCP to pull component props and examples when scaffolding UI.

Definition of Done
- The task compiles and runs locally (where applicable).
- Acceptance checks in PLAN.md are satisfied.
- No secrets in client bundles; server secrets only in Workers.
- Add short notes in the PR: summary, files touched, manual test steps, linked RFC/ADR/BDD.
- Flip the checklist box to `[x]`, add PR path and Done date.

Files to Know
- `PLAN.md` — step-by-step tasks (IDs, deliverables, checks).
- `CHECKLIST.md` — status per task.
- `docs/prds/` `docs/rfcs/` `docs/adrs/` `docs/features/` — product/architecture specs.
 - Mediabunny: Use for in-browser recording and JIT media assets. Install with `bun add mediabunny`.

Coding Conventions
- TypeScript for app/Workers; Go (Pion) or Rust (webrtc-rs) for the container recorder (preferred).
- Keep functions small and testable; avoid one-letter names.
- Don’t refactor unrelated code.

Review Tips
- Validate env var usage matches `scripts/env.md` (once added).
- Confirm R2 and D1 interactions align with `docs/storage-layout.md` and `control-plane/schema.sql` (once added).
 - Control plane health: `GET /health` should return `{ ok: true, db: true }`.

Migrations (D1)
- We use Drizzle ORM + drizzle-kit for D1 migrations.
- Generate migrations: `bun run db:generate` (outputs to `control-plane/migrations/`).
- Apply locally: `bun run db:apply:local`.
- Apply remote (prod/staging): `bun run db:apply:remote`.
- Do not hand-edit `control-plane/schema.sql` in normal flow; keep schema truth in `control-plane/src/db/schema.ts` + generated migrations.

Contact
- If blocked by missing infra (RTK app, R2, D1), note it in the PR and stop.
