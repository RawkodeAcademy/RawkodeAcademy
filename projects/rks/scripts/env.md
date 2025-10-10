# Runtime Environment Variables

This document enumerates every environment variable required by the Rawkode Studio services. Duplicate these values into `.env` by starting from `.env.example`.

| Variable | Purpose |
| --- | --- |
| `RTK_APP_ID` | Respoke RTK application identifier used to authenticate API requests. |
| `RTK_APP_SECRET` | Secret token for the RTK application; keep server-side only. |
| `RTK_BASE_URL` | RTK HTTP base URL (e.g., `https://realtime.cloudflare.com` or your gateway). |
| `STUDIO_REALTIME_TOKEN` | Alternative secret source for RTK (used in prod via Secret Store binding). |
| `TURN_KEY_ID` | Optional credential identifier for the TURN service that supports guest connectivity. |
| `TURN_KEY_API_TOKEN` | API token paired with `TURN_KEY_ID`. |
| `ACCOUNT_ID` | Cloudflare account ID used for Worker, R2, and D1 bindings. |
| `API_TOKEN` | Cloudflare API token with permissions to manage Workers, R2 buckets, and D1 databases. |
| `R2_ACCOUNT_ID` | Cloudflare R2 account namespace identifier. |
| `R2_ACCESS_KEY_ID` | Access key for R2 programmatic access. |
| `R2_SECRET_ACCESS_KEY` | Secret key for R2 programmatic access. |
| `R2_BUCKET_MEDIA` | Single R2 bucket for all media assets (session-scoped directories). |
| `D1_DB_NAME` | Name of the D1 database that stores application state. |
| `D1_BINDING` | Wrangler binding name used to access the D1 database from Workers. |
| `ATPROTO_CLIENT_ID` | OAuth client ID for Atproto login. |
| `ATPROTO_CLIENT_SECRET` | OAuth client secret for Atproto login. |
| `OAUTH_REDIRECT_URI` | Redirect URI registered with Atproto for OAuth callbacks. |
| `COMMENTS_WS_URL` | WebSocket endpoint providing live comments feed to the frontend. |
| `RTK_FAKE` | When set to `true` in Worker environment, the RTK proxy endpoints operate in stub mode (dev only). |
| `PUBLIC_RKS_PROGRESSIVE_UPLOAD` | Feature flag (string `true`/`false`). When `true`, the client performs progressive ISO uploads during recording. When `false`, recording stays local-only and exposes a download link. Default: `false` for local dev. |
| `PUBLIC_RKS_WORKER_URL` | Base URL of the Control Plane Worker (e.g., `https://studio-control-plane.rawkodeacademy.workers.dev`). The web app uses this to call API routes like `/sessions`, `/uploads/iso/*`, and `/rtk/*`. |

Local dev (direnv + 1Password)
- Add to `.envrc` (resolves via 1Password):
  - `export RTK_APP_ID="6b1a591c-4317-4f86-95bd-9fd37b04b379"`
  - `export RTK_BASE_URL="https://rtc.live.cloudflare.com"`
  - `export RTK_APP_SECRET="op://Employee/w3etxulw37bsqb2rsna5px7y4u/api-tokens/studio-realtime"`

Production/staging (Cloudflare Secret Store)
- Bind secret store ID `492e5e40b9d64ebeac7e7a77db91ff6e` into the Worker as env var `STUDIO_REALTIME_TOKEN`.
- The Worker automatically prefers `RTK_APP_SECRET` and falls back to `STUDIO_REALTIME_TOKEN` if unset.

> **Security**: Never bundle these secrets in client-side code. Keep all RTK credentials only in Workers/DOs.

Frontend → Control Plane wiring
- Set `PUBLIC_RKS_WORKER_URL` to your deployed Control Plane domain.
- Example: `export PUBLIC_RKS_WORKER_URL="https://studio-control-plane.rawkodeacademy.workers.dev"`.
- CORS: The Control Plane reflects the `Origin` header and allows `GET,POST,PUT,OPTIONS` with `content-type`, `x-part-no`, and `x-content-sha256` headers.
