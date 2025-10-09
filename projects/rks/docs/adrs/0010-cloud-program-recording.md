---
title: "Cloud backup program recording to R2"
status: Accepted
date: 2025-10-09
deciders: [Media, Infra]
consulted: [Engineering]
informed: [All]
supersedes: []
superseded_by: null
---

## Context
We need a reliable backup recording independent of the producer browser.

## Decision
Run a per‑show headless recorder (Cloudflare Container) that subscribes to the program track via RTK and writes MP4 (H.264/AAC 1080p30) to R2.

## Consequences
- Pros: Resilient backup, NLE‑friendly format.
- Cons: Additional compute cost and infra.

## References
- RFC‑0008 Cloud Program Recorder

