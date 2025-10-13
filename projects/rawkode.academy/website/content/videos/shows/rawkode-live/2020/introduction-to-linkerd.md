---
id: introduction-to-linkerd
slug: introduction-to-linkerd
title: Introduction to Linkerd
description: |-
  Linkerd is a service mesh for Kubernetes. It makes running services easier and safer by giving you runtime debugging, observability, reliability, and security—all without requiring any changes to your code.

  Linkerd works by installing a set of ultralight, transparent proxies next to each service instance. These proxies automatically handle all traffic to and from the service. Because they're transparent, these proxies act as highly instrumented out-of-process network stacks, sending telemetry to, and receiving control signals from, the control plane. This design allows Linkerd to measure and manipulate traffic to and from your service without introducing excessive latency.

  In order to be as small, lightweight, and safe as possible, Linkerd's proxies are written in Rust and specialized for Linkerd.

  🕰 Timeline

  00:00 - Holding screen
  01:25 - Introductions
  03:10 - What is a service mesh?
  06:50 - What are we working with?
  07:30 - Installing Linkerd
  12:50 - Linkerd dashboard
  15:40 - Linkerd top
  18:10 - Deploying the demo app
  20:40 - Injecting the Linkerd sidecar
  24:15 - Stat command
  28:20 - Tap command
  31:30 - Fault injection / TrafficSplit / Canary Deploys
  40:50 - Time outs and retries
  49:20 - mTLS
  55:30 - Multi-cluster
  1:09:00 - Closing


  🌎 Resources

  Linkerd - https://linkerd.io
  Thomas Rampelberg - https://twitter.com/grampelberg
publishedAt: 2020-11-04T17:00:00.000Z
technologies:
  - linkerd
show: rawkode-live
videoId: ogx55a28acwbzuwd1d1ic3lm
---

