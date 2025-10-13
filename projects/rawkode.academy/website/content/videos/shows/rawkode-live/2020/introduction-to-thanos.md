---
id: introduction-to-thanos
slug: introduction-to-thanos
title: Introduction to Thanos
description: |-
  Special Guest: Bartłomiej Płotka (https://twitter.com/bwplotka)

  Bartek Plotka is a Principal Software Engineer at Red Hat with a background in SRE, currently working on OpenShift Observability. As the co-author of the CNCF Thanos project and core maintainer of various open-source projects including Prometheus, he enjoys building OSS communities and maintainable, reliable distributed systems. On top of that, he is active in the CNCF SIG Observability as the technical lead. Volleyball player in free time.

  Thanos is a set of components that can be composed into a highly available metric system with unlimited storage capacity, which can be added seamlessly on top of existing Prometheus deployments.

  Thanos is a CNCF Incubating project.

  Thanos leverages the Prometheus 2.0 storage format to cost-efficiently store historical metric data in any object storage while retaining fast query latencies. Additionally, it provides a global query view across all Prometheus installations and can merge data from Prometheus HA pairs on the fly.

  Concretely the aims of the project are:

  - Global query view of metrics.
  - Unlimited retention of metrics.
  - High availability of components, including Prometheus.

  🕰 Timeline

  00:00 - Holding screen
  01:00 - Introductions
  04:50 - What is Thanos?
  20:00 - Generating some fake time series data with thanosbench
  26:00 - Running three Prometheus servers
  40:00 - Running the Thanos sidecars
  45:20 - Running the Thanos querier
  58:10 - Connecting Thanos to S3 / Minio
  1:14:00 - Enabling compaction and downsampling

  🌎 Resources

  Bartek Plotka - https://twitter.com/bwplotka
  Thanos - https://thanos.io
publishedAt: 2020-11-11T17:00:00.000Z
technologies:
  - thanos
show: rawkode-live
videoId: p78opknhykk7739gvc7kf5z5
---

