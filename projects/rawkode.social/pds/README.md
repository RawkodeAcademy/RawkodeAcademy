# Rawkode Single-User ATProto PDS

This project implements a production-ready, single-user ATProto Personal Data Server that runs entirely on Cloudflare primitives. The Worker process handles all XRPC entry points, persists the full repository (including IPLD blocks and commit metadata) inside D1, stores media blobs in R2, and fans out firehose events through a Durable Object. Bun and Drizzle power the local developer experience.

## Architecture

```
client → Cloudflare Worker (Hono)
          ├─ D1 (ATProto repo blocks, commits, indexes)
          ├─ R2 (blob storage keyed by CID)
          ├─ KV (session state + cached documents)
          └─ Durable Object (firehose WebSocket broadcaster)
```

Key design decisions:

- **D1 is the source of truth for the repository.** Commit blocks, root metadata, record indexes, and account identity all live in transactional tables so writes never span services.
- **A Durable Object provides federation events.** Successful commits post CBOR-encoded `subscribeRepos` frames to a single DO instance that maintains persistent WebSocket clients for relays.
- **Stateless compute.** Every request recreates the ATProto `Repo` view on top of the D1-backed storage adapter, guaranteeing consistent CAR output without in-memory caches.

## Prerequisites

- Cloudflare account with Workers, D1, R2, KV, and Durable Objects enabled.
- Bun ≥ 1.1, Wrangler ≥ 3.114, and SQLite CLI (for inspecting D1 locally).

## Bootstrapping the Cloudflare resources

```bash
wrangler d1 create rawkode_pds
wrangler r2 bucket create rawkode-pds-posts
wrangler kv namespace create SETTINGS
wrangler deploy --dry-run
```

## Secrets and configuration

Set the runtime secrets that power authentication and signing:

```bash
wrangler secret put ADMIN_PASSWORD       # plain-text admin password
wrangler secret put JWT_SECRET           # HMAC used for session tokens
wrangler secret put PDS_SIGNING_KEY      # hex-encoded secp256k1 private key
```

Update `wrangler.toml` with your deployment DID/handle, D1 database ID, KV namespace ID, and R2 bucket name. The DID should match the hostname that serves this Worker (`did:web:your-domain`).

## Local development workflow

1. Install dependencies and generate types:
   ```bash
   bun install
   ```
2. Apply the D1 schema locally:
   ```bash
   wrangler d1 migrations apply rawkode_pds --local
   ```
3. Run the worker with live bindings:
   ```bash
   bun run dev
   ```
4. Generate migrations after editing the Drizzle schema:
   ```bash
   bun run drizzle:generate
   ```

## Deployment

Deploy the worker once the secrets and bindings are configured:

```bash
bun run deploy
```

## Supported XRPC endpoints

- `GET /.well-known/did.json` and `GET /.well-known/atproto-did` – discovery documents.
- `GET /xrpc/com.atproto.server.describeServer` – advertised PDS capabilities.
- `POST /xrpc/com.atproto.server.createSession`, `refreshSession`, `deleteSession`, `GET ...getSession` – password-backed auth for the single account.
- `POST /xrpc/com.atproto.repo.createRecord`, `putRecord`, `deleteRecord`, `applyWrites` – mutate repository state with swap protection and lexicon validation.
- `POST /xrpc/com.atproto.repo.uploadBlob` – store media blobs in R2 and return deterministic blob refs.
- `GET /xrpc/com.atproto.repo.listRecords` / `getRecord` – read records through D1-backed block decoding.
- `GET /xrpc/com.atproto.sync.getRepo`, `getBlocks`, `getLatestCommit`, `getRecord`, `listRepos`, `getBlob` – replication endpoints returning CAR streams, block diffs, and blob payloads.
- `GET /xrpc/com.atproto.sync.subscribeRepos` – upgrade to a firehose WebSocket managed by the Durable Object.
- `GET /blobs/:cid` – serve permanent blobs from R2.

Each commit updates the D1 tables atomically, refreshes the repository head, and pushes a CBOR frame to the `FirehoseDurableObject`, enabling connected relays to stream updates in real time.

## Testing

```bash
bun run check
bun test
```

## Next steps

The core implementation handles posts, but the storage adapter and firehose plumbing make it straightforward to add additional ATProto collections (likes, reposts, labels) or to expose richer observability metrics for production operations.
