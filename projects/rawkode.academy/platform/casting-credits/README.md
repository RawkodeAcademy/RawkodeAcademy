---
runme:
  version: v3
shell: bash
---

# Casting Credits Service

The Casting Credits service manages the relationship between people, their roles (host, guest, etc.), and videos. It provides a GraphQL API that integrates with the federated graph.

## Local Development

### Database

```sh {"background":"true","name":"dev-db"}
turso dev --port 2000
```

### Read Model

```sh {"name":"read-model"}
# Restricting ENV not working right now:
# https://github.com/denoland/deno/pull/26758
# when we can, add --allow-env=$DENO_ALLOWED_ENV
deno run --allow-env --allow-write=./read-model/schema.gql --allow-net read-model/main.ts
```

### Checks, Formatting, & Linting

```sh {"name":"check"}
deno fmt --check
deno lint
```

### Testing

```sh {"name":"test"}
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

## Deploy

### Data Model

```sh {"name":"dev-db"}
export LIBSQL_URL="https://${SERVICE_NAME}-${LIBSQL_BASE_URL}"
export LIBSQL_TOKEN="op://sa.rawkode.academy/turso/platform-group/api-token"

(cd data-model && op run -- deno --allow-all migrate.ts)
```

### Read Model

```sh {"name":"deploy-read-model"}
(cd read-model && bunx wrangler deploy --var SERVICE_NAME=${SERVICE_NAME} --var LIBSQL_BASE_URL=${LIBSQL_BASE_URL})

bun run read-model/publish.ts
bunx wgc subgraph publish ${SERVICE_NAME} --namespace production --schema ./read-model/schema.gql --routing-url https://${SERVICE_NAME}.api.rawkode.academy
```

## Architecture

The service consists of two main components:

1. **Data Model**: Defines the database schema and provides migration utilities.
2. **Read Model**: Exposes the data through a GraphQL API that integrates with the federated graph.

### Data Model

The data model uses Drizzle ORM with a SQLite database (Turso). It defines a `casting-credits` table that links people, roles, and videos.

### Read Model

The read model uses Pothos GraphQL to define a federated GraphQL schema. It extends the `Video` type to add a `creditsForRole` field that returns casting credits for a specific role.

## Testing

The service includes comprehensive tests for both the data model and GraphQL API. See the [tests/README.md](./tests/README.md) for more details.
