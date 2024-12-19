---
shell: bash
---

# Meilisearch

## Deployment

```shell {"name": "deploy"}
export REGION="europe-west2"
export PROJECT="rawkode-academy-production"

gcloud auth configure-docker ${REGION}-docker.pkg.dev

tar -czf meilisearch.tar.gz helm-release.yaml

oras push ${REGION}-docker.pkg.dev/${PROJECT}/rawkode-academy/meilisearch:v1.0.0 meilisearch.tar.gz
```
