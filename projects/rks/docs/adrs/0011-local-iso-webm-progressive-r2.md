---
title: "Local ISO recording (WebM) with progressive upload to R2"
status: Accepted
date: 2025-10-09
deciders: [Media]
consulted: [Platform]
informed: [All]
supersedes: []
superseded_by: null
---

## Context
We require high‑quality per‑participant recordings and robust recovery from disconnects.

## Decision
Record ISOs in browser using MediaRecorder (WebM; H.264 if available). Upload chunks progressively to R2; allow 7‑day resume.

## Consequences
- Pros: Best end‑user quality; resilient uploads; no special desktop app.
- Cons: Browser codec variability; storage bandwidth at client.

## References
- RFC‑0004 Local ISO Recording & Uploads

