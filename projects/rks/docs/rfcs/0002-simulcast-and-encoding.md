---
title: Program Simulcast & Encoding Strategy
status: Draft
created: 2025-10-09
owner: Media
reviewers: [Engineering]
review_window: 2025-10-09 → 2025-10-16
---

## Summary
Define the program output simulcast ladder and encoder settings for v1 to meet latency/quality targets and viewer device compatibility.

## Ladder
- RIDs: f=1080p (~5.5–6.0 Mbps), h=720p (~2.5–3.5 Mbps), q=360p (~0.6–1.0 Mbps)
- Keyframe interval: 2 seconds; GOP aligned across layers.
- Codec: H.264 (High), audio Opus 48 kHz @ 128 kbps stereo.

## Publisher (Producer) Configuration
Use `RTCRtpTransceiver` with `sendEncodings` including RIDs; enable `degradationPreference="balanced"`; set bitrate caps per layer.

## Subscriber (Viewer) Selection
- Default Auto: RTK chooses layer based on network; manual selector sets `preferredRid` via `/tracks/update`.
- Switching behavior: Target ≤ 2 seconds to settle; maintain playback continuity.

## Constraints
- 30 fps globally.
- Producer uplink must sustain ≈ 12 Mbps including overhead for three layers.

## Drawbacks
- Higher producer CPU/network vs single stream.

## Adoption Plan
Ship ladder above; allow tuning via config without UI in v1.

