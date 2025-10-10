# Runtime Environment Variables

This document enumerates every environment variable required by the Rawkode Studio services. Duplicate these values into `.env` by starting from `.env.example`.

| Variable | Purpose |
| --- | --- |
| `RTK_APP_ID` | Respoke RTK application identifier used to authenticate API requests. |
| `RTK_APP_SECRET` | Secret token for the RTK application; keep server-side only. |
| `TURN_KEY_ID` | Optional credential identifier for the TURN service that supports guest connectivity. |
| `TURN_KEY_API_TOKEN` | API token paired with `TURN_KEY_ID`. |
| `ACCOUNT_ID` | Cloudflare account ID used for Worker, R2, and D1 bindings. |
| `API_TOKEN` | Cloudflare API token with permissions to manage Workers, R2 buckets, and D1 databases. |
| `R2_ACCOUNT_ID` | Cloudflare R2 account namespace identifier. |
| `R2_ACCESS_KEY_ID` | Access key for R2 programmatic access. |
| `R2_SECRET_ACCESS_KEY` | Secret key for R2 programmatic access. |
| `R2_BUCKET_RECORDINGS` | R2 bucket name for program recording segments. |
| `R2_BUCKET_ISO` | R2 bucket name dedicated to ISO upload manifests and parts. |
| `D1_DB_NAME` | Name of the D1 database that stores application state. |
| `D1_BINDING` | Wrangler binding name used to access the D1 database from Workers. |
| `ATPROTO_CLIENT_ID` | OAuth client ID for Atproto login. |
| `ATPROTO_CLIENT_SECRET` | OAuth client secret for Atproto login. |
| `OAUTH_REDIRECT_URI` | Redirect URI registered with Atproto for OAuth callbacks. |
| `COMMENTS_WS_URL` | WebSocket endpoint providing live comments feed to the frontend. |

> **Security**: Never bundle these secrets in client-side code. Restrict exposure to the minimum set of services.
