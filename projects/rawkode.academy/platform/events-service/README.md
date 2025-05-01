# Events Service

A Deno-based service for managing events.

## Local Development

### Prerequisites

- Deno 2.x
- Turso CLI
- 1Password CLI (op) for secrets management

### Database Setup

```sh
# Start a local Turso database
turso dev --port 2001

# In a new terminal, set up the database
deno run --allow-env --allow-net setup-db.ts
```

### Running the Service

```sh
# Run the read model (GraphQL API)
deno run --allow-env --allow-write=./read-model/schema.gql --allow-net read-model/main.ts

# Run the write model
deno run --allow-env --allow-net write-model/main.ts
```

### Checks, Formatting, & Linting

```sh
deno fmt --check
deno lint
```

## Deploy

### Data Model

```sh
export LIBSQL_URL="https://${SERVICE_NAME}-${LIBSQL_BASE_URL}"
export LIBSQL_TOKEN="op://sa.rawkode.academy/turso/platform-group/api-token"

op run -- deno --allow-all migrate.ts
```

### Read Model

```sh
epoch=$(date +%s)

podman image build --target=read-model --tag europe-west2-docker.pkg.dev/rawkode-academy-production/rawkode-academy/${SERVICE_NAME}-read:${epoch} .
podman image push europe-west2-docker.pkg.dev/rawkode-academy-production/rawkode-academy/${SERVICE_NAME}-read:${epoch}

gcloud run deploy ${SERVICE_NAME}-read \
      --image=europe-west2-docker.pkg.dev/rawkode-academy-production/rawkode-academy/${SERVICE_NAME}-read:${epoch} \
      --region=europe-west2 \
      --use-http2 \
      --allow-unauthenticated \
      --cpu="1" --memory="512Mi" \
      --cpu-boost \
      --set-env-vars="SERVICE_NAME=${SERVICE_NAME},LIBSQL_BASE_URL=rawkodeacademy.turso.io" \
      --set-secrets="LIBSQL_TOKEN=turso-platform-token-rw:latest,SENTRY_DSN=${SERVICE_NAME}-read-sentry-dsn:latest"

deno run --allow-all read-model/publish.ts
bunx wgc subgraph publish ${SERVICE_NAME} --namespace production --schema ./read-model/schema.gql --routing-url https://${SERVICE_NAME}-read-458678766461.europe-west2.run.app
```

### Write Model

```sh
epoch=$(date +%s)

podman image build --target=write-model --tag europe-west2-docker.pkg.dev/rawkode-academy-production/rawkode-academy/${SERVICE_NAME}-write:${epoch} .
podman image push europe-west2-docker.pkg.dev/rawkode-academy-production/rawkode-academy/${SERVICE_NAME}-write:${epoch}

gcloud run deploy ${SERVICE_NAME}-write \
      --image=europe-west2-docker.pkg.dev/rawkode-academy-production/rawkode-academy/${SERVICE_NAME}-write:${epoch} \
      --tag v${epoch} \
      --region=europe-west2 \
      --use-http2 \
      --allow-unauthenticated \
      --cpu="1" --memory="512Mi" \
      --cpu-boost \
      --set-env-vars="SERVICE_NAME=${SERVICE_NAME},LIBSQL_BASE_URL=rawkodeacademy.turso.io" \
      --set-secrets="LIBSQL_TOKEN=turso-platform-token-rw:latest,RESTATE_IDENTITY_KEY=restate-identity-key:latest"

deno run -A --no-config 'npm:@restatedev/restate' deployments register https://v${epoch}---${SERVICE_NAME}-write-wlnfqm3bkq-nw.a.run.app
```
