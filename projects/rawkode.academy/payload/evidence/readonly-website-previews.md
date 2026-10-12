# Read-only website previews

Website previews reuse the accepted, populated
`rawkode-academy-payload-pr-1419-e031467d5788#PublicContentBridge` at source SHA
`e031467d5788b74e5a9d9dc8841d2c4362820ae3`. The source is recorded in
`scripts/website-preview-source.mjs`; it is a content baseline, not a claim that
new backend code has been deployed. Backend/schema/content changes require a
separately validated replacement baseline. Production migration and cutover
remain separate operator work.

The website PR pipeline builds/tests the site and deploys only its website
Worker and isolation Worker, with a session KV namespace named for the current
website PR/head SHA. It performs no D1/R2 provisioning, migration/import,
Payload deployment, GitHub backend-check polling or backend readiness calls.
The Payload PR pipeline runs its typecheck and regression tests without a
backend deployment. Existing operator migration/import/deploy tasks remain.

The isolation Worker's default entrypoint denies identity access. Its named
`PublicContentReadOnly` entrypoint forwards only GET requests on the public
collection, asset, diagram and demo paths to the source's `PublicContentBridge`.
It blocks `/v1/preview/readiness`, all other paths and all non-GET methods before
calling the source. The website gateway also rejects non-GET requests, including
static assets (`assets.run_worker_first`), with 405 and `Allow: GET`.

Website content caches retain the current website PR/head namespace, and native
HTML cache keys retain the website host. Credential-bearing requests bypass
shared HTML caches. Production routes, email and write-service bindings are
removed from the website preview; identity binds only to its deny-all Worker.
The source SHA is reported separately from the current website SHA.

Deployment checks read public content only: sanitized ordinary projections,
video SSR, anonymous cache HIT, credential bypass, sign-in disabled, method
rejection on dynamic/static routes, WebContainer SSR/headers, D2 SVG checksums
and Cloudflare Images WebP. The pipeline delivery gate requires a verification
marker for the current PR/head and exact source and version-preview URL; missing
or stale markers fail instead of accepting a no-op deployment.

These previews do not exercise editorial saves or create/wait for scheduled
publication fixtures. Publication-boundary and visibility regressions remain
in the local tests. The earlier accepted baseline's hosted scheduling and D2
save-hook evidence remains in PR #1419; it does not establish new backend or
production acceptance.

Cleanup excludes the source Worker, D1 (by both UUID and name) and R2 bucket.
The trusted close workflow additionally retains PR #1419 resources until this
shared baseline is explicitly replaced and retired. Other PRs retain normal
PR-name-scoped cleanup. The base branch did not contain this PR's cleanup
workflow when checked on 2026-10-12; this safeguard is for the future workflow,
not a claim that unmerged PR code controls `pull_request_target`.
