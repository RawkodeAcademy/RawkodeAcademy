-- Web Events Pipeline Transformation
-- Optimized for Apache DataFusion (via Arroyo)
-- Processes CloudEvents for web analytics (page views, exits, etc.)

INSERT INTO web_events
-- Parse minimally, filter early, then extract the rest
WITH base AS (
  SELECT
    value,
    extract_json_string(value, '$.type') AS event_type,
    extract_json_string(value, '$.specversion') AS ce_specversion
  FROM analytics
),
filtered AS (
  SELECT value, event_type, ce_specversion
  FROM base
  WHERE event_type LIKE 'analytics.web.%'
    AND ce_specversion = '1.0'
),
extracted_data AS (
  -- Extract remaining fields once
  SELECT
    value,
    event_type,
    ce_specversion,
    extract_json_string(value, '$.id') as event_id,
    extract_json_string(value, '$.time') as event_time,
    extract_json_string(value, '$.source') as event_source,
    extract_json_string(value, '$.subject') as ce_subject,
    extract_json_string(value, '$.sessionid') as session_id,
    extract_json_string(value, '$.userid') as user_id,
    extract_json_string(value, '$.projectid') as project_id,
    extract_json_string(value, '$.environment') as environment,
    extract_json_string(value, '$.data.page_url') as page_url,
    extract_json_string(value, '$.data.page_title') as page_title,
    extract_json_string(value, '$.data.referrer') as referrer,
    extract_json_string(value, '$.data.time_on_page') as time_on_page_str,
    extract_json_string(value, '$.data.utm_source') as utm_source,
    extract_json_string(value, '$.data.utm_medium') as utm_medium,
    extract_json_string(value, '$.data.utm_campaign') as utm_campaign,
    extract_json_string(value, '$.data.utm_term') as utm_term,
    extract_json_string(value, '$.data.utm_content') as utm_content
  FROM filtered
)
SELECT
  -- Core event fields
  event_id,
  event_type,
  event_time,
  event_source,
  ce_specversion,
  ce_subject,

  -- Session/user tracking
  session_id,
  user_id,
  project_id,
  environment,

  -- Page data
  page_url,
  page_title,
  referrer,
  TRY_CAST(time_on_page_str AS DOUBLE) as time_on_page,

  -- UTM tracking
  utm_source,
  utm_medium,
  utm_campaign,
  utm_term,
  utm_content,

  -- Computed fields using DataFusion optimized functions
  -- CloudEvents time is ISO8601; parse directly to TIMESTAMP
  to_timestamp(event_time) as timestamp_unix,

  -- Robust domain extraction for absolute URLs only
  CASE
    WHEN page_url IS NOT NULL AND page_url != ''
         AND (starts_with(page_url, 'http://') OR starts_with(page_url, 'https://'))
    THEN split_part(split_part(page_url, '//', 2), '/', 1)
    ELSE NULL
  END as domain,

  -- Path: handle absolute and relative URLs; drop query/fragment; default '/'
  CASE
    WHEN page_url IS NOT NULL AND page_url != '' THEN
      COALESCE(
        NULLIF(
          split_part(
            split_part(
              CASE
                WHEN starts_with(page_url, 'http://') OR starts_with(page_url, 'https://')
                THEN regexp_replace(page_url, '^https?://[^/]+', '')
                ELSE page_url
              END,
              '?', 1
            ),
            '#', 1
          ),
          ''
        ),
        '/'
      )
    ELSE '/'
  END as path,

  -- Extract event category
  split_part(event_type, '.', 2) as event_category,

  -- Metadata
  now() as ingested_at

FROM extracted_data
