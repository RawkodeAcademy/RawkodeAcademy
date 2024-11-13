---
shell: bash
---

# Episodes Service

## Local Development

### Database

This dagger command will provision a libsql server and run the migrations.

```shell '{"name": "dev"}'
dagger call dev up
```

### Read Model

```shell '{"name": "read-model"}'
deno run --unstable --v8-flags=--max-heap-size=50,--max-old-space-size=50 --allow-env --allow-net read-model/main.ts
```

### Checks, Formatting, & Linting

````shell {"name": "check"}
deno fmt
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
epoch=$(date +%s)

op read op://Employee/Scaleway/secretKey | docker login rg.nl-ams.scw.cloud/graphql-api --username nologin --password-stdin
podman image build -t europe-west2-docker.pkg.dev/rawkode-academy/episodes-read:${epoch} .
podman image push europe-west2-docker.pkg.dev/rawkode-academy/episodes-read:${epoch}
scw container container create name=episodes namespace-id=0c22c1a2-34a7-4e80-90aa-8099dffba349 min-scale=0 max-scale=2 memory-limit=400 cpu-limit=400 timeout=10s privacy=public registry-image=rg.nl-ams.scw.cloud/graphql-api/episodes-read:latest port=8000 deploy=true region=nl-ams http-option=redirected protocol=h2c

### Write Model

```shell '{"name": "deploy-write-model"}'
export LIBSQL_URL=""
export LIBSQL_TOKEN=""
export RESTATE_IDENTITY_KEY=""

deployctl deploy --config=deployctl-write-model.json --org="Rawkode Academy" --env=RESTATE_IDENTITY_KEY=${RESTATE_IDENTITY_KEY} --env=LIBSQL_URL=${LIBSQL_URL} --env=LIBSQL_TOKEN=${LIBSQL_TOKEN}

deno run -A --no-config 'npm:@restatedev/restate' deployments register https://plt-episodes-r.deno.dev/
```
