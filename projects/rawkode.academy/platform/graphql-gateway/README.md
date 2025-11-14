# GraphQL Gateway

Cloudflare Worker that composes every `@platform` GraphQL read-model into a single supergraph using [GraphQL Hive Gateway Runtime](https://github.com/graphql-hive/gateway).

Install dependencies with `bun install`.

## Scripts (Bun)

- `bun run supergraph:build` – publishes every subgraph SDL, runs `rover supergraph compose`, and emits `src/generated/supergraph.ts`.
- `bun run dev` – starts the Worker locally with the last generated supergraph.
- `bun run deploy` – deploys the worker with Wrangler.

> **Note:** the generated files live under `src/generated/` and get overwritten every time the supergraph build script runs.

## Adding a Subgraph

1. Ensure the service exposes a `read-model/publish.ts` script that writes `schema.gql`.
2. Append the service to `scripts/compose-supergraph.ts` so the composer knows how to invoke the publisher and where the Worker will find the live routing URL.
3. Run `bun run supergraph:build` to regenerate the federated supergraph before deploying.
