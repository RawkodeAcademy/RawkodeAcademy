---
id: introduction-to-cortex
slug: introduction-to-cortex
title: Introduction to Cortex
description: |-
  Cortex: horizontally scalable, highly available, multi-tenant, long term storage for Prometheus.

  Cortex provides horizontally scalable, highly available, multi-tenant, long term storage for Prometheus.

      Horizontally scalable: Cortex can run across multiple machines in a cluster, exceeding the throughput and storage of a single machine. This enables you to send the metrics from multiple Prometheus servers to a single Cortex cluster and run "globally aggregated" queries across all data in a single place.
      Highly available: When run in a cluster, Cortex can replicate data between machines. This allows you to survive machine failure without gaps in your graphs.
      Multi-tenant: Cortex can isolate data and queries from multiple different independent Prometheus sources in a single cluster, allowing untrusted parties to share the same cluster.
      Long term storage: Cortex supports Amazon DynamoDB, Google Bigtable, Cassandra, S3, GCS and Microsoft Azure for long term storage of metric data. This allows you to durably store data for longer than the lifetime of any single machine, and use this data for long term capacity planning.

  Cortex is a CNCF incubation project used in several production systems including Weave Cloud and Grafana Cloud. Cortex is primarily used as a remote write destination for Prometheus, with a Prometheus-compatible query API.

  🕰 Timeline

  00:00 - Holding screen
  01:25 - Introductions
  03:45 - What problem is Cortex solving?
  07:20 - What was prepared upfront?
  08:15 - Building Cortex from source
  14:30 - Running Prometheus with Cortex
  25:20 - Slides and demo - Cortex architecture and scaling
  45:00 - Walking through the demo ourselves
  54:00 - Cortex architecture

  🌎 Resources

  Ganesh Vernekar - https://twitter.com/_codesome
  Cortex - https://cortex.io
publishedAt: 2020-11-04T17:00:00.000Z
technologies:
  - cortex
show: rawkode-live
videoId: p2b72nkxzbj3rgb4v4knvo4y
---

