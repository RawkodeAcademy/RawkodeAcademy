# R2 Storage Layout

This document defines the object layout for Rawkode Studio recording assets stored in a single Cloudflare R2 bucket.

## Bucket

- Bucket: `R2_BUCKET_MEDIA`

## Keys (session-scoped)

- Program (mix): `sessions/{sessionId}/program/program-{timestamp}-{sequence}.mp4`
  - `sessionId`: UUID of the live/recording session.
  - `timestamp`: UTC timestamp (`YYYYMMDDTHHMMSSZ`) marking segment creation.
  - `sequence`: Zero-padded incrementing segment counter (e.g., `001`).

- ISO uploads:
  - Manifest: `sessions/{sessionId}/iso/{userId}/{kind}/manifest.json`
  - Part: `sessions/{sessionId}/iso/{userId}/{kind}/parts/part-{partNumber}`
    - `userId`: UUID corresponding to the participant.
    - `kind`: Asset variant (e.g., `camera`, `screen`, `microphone`).
    - `partNumber`: Zero-padded integer for chunk ordering.

Store manifests as JSON with byte totals, checksums, and status. Parts are uploaded sequentially; unsuccessful attempts are retried with the same key until confirmed.

## Retention Guidance

Follow PRD §11: keep program recordings for 90 days by default and ISO uploads for 30 days. Older segments should be archived to cold storage or purged per customer contract.
