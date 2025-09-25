# Creating Pipeline

```shell
op run -- bun run wrangler pipelines streams create analytics --http-enabled true --http-auth false

op run -- bun run wrangler pipelines sinks create web_events \
	--catalog-token $DATA_CATALOG_TOKEN \
	--type r2-data-catalog \
	--bucket analytics \
	--namespace events \
	--table web
	# Defaults
	#--format parquet
	#--roll-interval 300

op run -- bun run wrangler pipelines create web-events --sql-file pipelines/web-events/transform.sql
```
