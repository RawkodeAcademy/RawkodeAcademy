# Agent Guide — Rawkode Studio

Scope: entire repo.

Purpose: Coordinate multiple agents implementing v1. Use PLAN.md for task details and CHECKLIST.md to track progress.

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
- Confirm R2 and D1 interactions align with `docs/storage-layout.md` and `workers/schema.sql` (once added).

Contact
- If blocked by missing infra (RTK app, R2, D1), note it in the PR and stop.
