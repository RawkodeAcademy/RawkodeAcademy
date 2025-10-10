# R2 Storage Layout

This document defines the object layout for Rawkode Studio recording assets stored in Cloudflare R2.

## Program Recordings

- **Bucket**: `R2_BUCKET_RECORDINGS`
- **Key format**: `program-recordings/{showId}/program-{timestamp}-{sequence}.mp4`
  - `showId`: UUID of the show.
  - `timestamp`: UTC timestamp (`YYYYMMDDTHHMMSSZ`) marking segment creation.
  - `sequence`: Zero-padded incrementing segment counter (e.g., `001`).

Program recordings are immutable segments uploaded by the cloud program recorder. Retain the latest 90 days unless overridden by compliance policy.

## ISO Uploads

- **Bucket**: `R2_BUCKET_ISO`
- **Manifest key**: `iso-uploads/{showId}/{userId}/{kind}/manifest.json`
- **Part key**: `iso-uploads/{showId}/{userId}/{kind}/part-{partNumber}`
  - `showId`: UUID for the show session.
  - `userId`: UUID corresponding to the participant.
  - `kind`: Asset variant (e.g., `camera`, `screen`, `microphone`).
  - `partNumber`: Zero-padded integer for chunk ordering.

Store manifests as JSON objects that describe byte totals, checksums, and status. Parts are uploaded sequentially; unsuccessful attempts are retried with the same key until confirmed.

## Retention Guidance

Follow PRD §11: keep program recordings for 90 days by default and ISO uploads for 30 days. Older segments should be archived to cold storage or purged per customer contract.
