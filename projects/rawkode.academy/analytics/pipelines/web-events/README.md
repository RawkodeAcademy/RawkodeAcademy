# Web Events Pipeline

This pipeline processes web analytics events (page views, exits, etc.) from the analytics stream.

## Event Types Handled

- `analytics.web.pageview` - Page view events
- `analytics.web.page_exit` - Page exit events with time on page

## Schema

The pipeline extracts and transforms CloudEvents into a structured format optimized for web analytics queries.

### Input Format (CloudEvent in stream)

```json
{
  "value": {
    "id": "unique-event-id",
    "specversion": "1.0",
    "type": "analytics.web.pageview",
    "source": "https://rawkode.academy",
    "time": "2024-01-01T00:00:00Z",
    "sessionid": "session-123",
    "userid": "user-456",
    "data": {
      "page_url": "https://rawkode.academy/videos",
      "page_title": "Videos",
      "referrer": "https://google.com",
      "utm_source": "newsletter"
    }
  }
}
```

### Output Schema (Iceberg table)

| Field | Type | Description |
|-------|------|-------------|
| event_id | STRING | Unique event identifier |
| event_type | STRING | Full CloudEvent type (e.g., analytics.web.pageview) |
| event_time | STRING | ISO timestamp from CloudEvent |
| session_id | STRING | User session identifier |
| user_id | STRING | User identifier (if authenticated) |
| page_url | STRING | Full page URL |
| page_title | STRING | Page title |
| referrer | STRING | Referrer URL |
| domain | STRING | Computed: extracted domain from page_url |
| path | STRING | Computed: extracted path from page_url |
| timestamp_unix | TIMESTAMP | Computed: Unix timestamp for partitioning |
| ingested_at | TIMESTAMP | Pipeline ingestion time |

## Creating the Pipeline

```bash
cd website
op run -- bunx wrangler pipelines create web-events \
  --sql-file ../../analytics/pipelines/web-events/transform.sql
```

## Testing

Send a test event to the stream:

```bash
curl -X POST https://a18bf7e7f13a401881d1b42b86e14900.ingest.cloudflare.com \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{
    "value": {
      "id": "test-123",
      "specversion": "1.0",
      "type": "analytics.web.pageview",
      "source": "https://rawkode.academy",
      "time": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
      "sessionid": "test-session",
      "data": {
        "page_url": "https://rawkode.academy/test",
        "page_title": "Test Page"
      }
    }
  }]'
```

## Query Examples

```sql
-- Daily page views
SELECT
  DATE(timestamp_unix) as day,
  COUNT(*) as page_views,
  COUNT(DISTINCT session_id) as unique_sessions
FROM web_events
GROUP BY DATE(timestamp_unix)
ORDER BY day DESC;

-- Top pages by views
SELECT
  path,
  page_title,
  COUNT(*) as views
FROM web_events
WHERE timestamp_unix >= current_date - INTERVAL 7 DAY
GROUP BY path, page_title
ORDER BY views DESC
LIMIT 20;
```