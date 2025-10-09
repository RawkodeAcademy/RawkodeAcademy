---
title: "Program simulcast ladder (1080/720/360)"
status: Accepted
date: 2025-10-09
deciders: [Media]
consulted: [Engineering]
informed: [Product]
supersedes: []
superseded_by: null
---

## Context
Viewers span diverse devices and networks. RTK is an SFU, not a transcoder.

## Decision
Publish three simulcast layers (RIDs f/h/q) at ~5.5/3.0/0.8 Mbps; 30 fps, 2 s keyframes; Opus 128 kbps.

## Consequences
- Pros: ABR for viewers, manual quality selection possible.
- Cons: Higher producer uplink and CPU.

## References
- RFC‑0002 Program Simulcast & Encoding

