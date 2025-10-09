---
title: Scenes, Dynamic Grid & Transitions
status: Draft
created: 2025-10-09
owner: Frontend
reviewers: [Product]
review_window: 2025-10-09 → 2025-10-16
---

## Summary
Define the scene model and runtime for v1. Scenes are TypeScript modules that declare layers (video, audio, overlays, plugins). Dynamic grid is a layer that presents a selectable subset of participants. Transitions supported: blur, crossfade, wipe.

## Scene Model
- `Scene` interface: metadata, layers[], activation/deactivation hooks, optional media assets (JIT upload).
- Any active layer with audio contributes to program audio (except program return).
- Automatic scene switching: when a scene’s active media asset ends (video/audio), emit `onEnd` → DO switches to configured next scene.

## Dynamic Grid
- Grid sources: producer, selected guests, selected screenshares.
- Producer can add/remove at runtime; updates propagate via DataChannel and reflect in program composition within 200 ms.

## Overlays
- Logo, lower thirds, pinned comment, poll results, ticker; controlled by state.

