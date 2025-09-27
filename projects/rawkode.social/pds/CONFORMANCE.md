# ATProto Conformance Status

The Cloudflare-hosted single-user PDS now implements the full set of repo, sync, and firehose APIs required by the [bluesky-social/atproto](https://github.com/bluesky-social/atproto) conformance harness. Incoming writes are validated against the published lexicons, persisted to D1 as ATProto commits, and broadcast to Durable Object subscribers using CBOR-encoded `com.atproto.sync.subscribeRepos` frames. Blob uploads stream to R2 with deterministic CIDs so `sync.getBlob` and `repo.uploadBlob` pass the blob suite.

## Supported surface area

- **Repo writes** – `createRecord`, `putRecord`, `deleteRecord`, and `applyWrites` enforce swap conditions, index records in D1, and return commit metadata. `uploadBlob` stores blobs in R2 and returns canonical blob refs.
- **Repo reads** – `listRecords` and `getRecord` honour repo/collection filters and cursors. Sync consumers can retrieve commit diffs via `sync.getRepo`, `sync.getBlocks`, `sync.getRecord`, `sync.getBlob`, and `sync.getLatestCommit`.
- **Firehose** – `sync.subscribeRepos` upgrades to a Durable Object-managed WebSocket, replays historical commit frames from D1 sequence numbers, and streams live commits encoded as CAR diffs.
- **Identity and sessions** – DID discovery endpoints, session create/refresh/delete, and bearer token enforcement are unchanged and remain compatible with the suite.

With these behaviours in place the upstream conformance tests execute successfully against the Worker deployment.
