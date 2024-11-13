---
shell: bash
---

# Episodes Service

## Local Development

### Database

```shell '{"name": "dev-db"}'
turso dev --port 2000
```

### Read Model

```shell '{"name": "read-model"}'
deno run --allow-all read-model/main.ts
```

### Checks, Formatting, & Linting

````shell {"name": "check"}
deno fmt --check
deno lint
``


## Deploy

### Data Model

```shell {"name": "deploy-data-model"}
export LIBSQL_URL="https://episodes-rawkodeacademy.turso.io"
export LIBSQL_TOKEN="op://sa.rawkode.academy/turso/platform-group/api-token"

op run -- deno --allow-all data-model/migrate.ts
```

### Read Model

```shell '{"name": "deploy-read-model"}'
deno run --allow-all jsr:@deno/deployctl deploy --config=deployctl-read-model.json --org="Rawkode Academy"
bunx wgc subgraph publish people --namespace production --schema ./read-model/schema.graphql --routing-url https://plt-episodes-r.deno.dev

### Write Model

```shell '{"name": "deploy-write-model"}'
export LIBSQL_URL=""
export LIBSQL_TOKEN=""
export RESTATE_IDENTITY_KEY=""

deno run --allow-all jsr:@deno/deployctl deploy --config=deployctl-write-model.json --org="Rawkode Academy" --env=RESTATE_IDENTITY_KEY=${RESTATE_IDENTITY_KEY} --env=LIBSQL_URL=${LIBSQL_URL} --env=LIBSQL_TOKEN=${LIBSQL_TOKEN}

deno run -A --no-config 'npm:@restatedev/restate' deployments register https://plt-episodes-r.deno.dev/
```
````
