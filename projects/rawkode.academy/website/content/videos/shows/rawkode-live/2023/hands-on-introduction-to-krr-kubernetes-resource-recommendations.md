---
id: hands-on-introduction-to-krr-kubernetes-resource-recommendations
slug: hands-on-introduction-to-krr-kubernetes-resource-recommendations
title: Hands-on Introduction to KRR (Kubernetes Resource Recommendations)
description: |-
  Robusta KRR (Kubernetes Resource Recommender) is a CLI tool for optimizing resource allocation in Kubernetes clusters. It gathers pod usage data from Prometheus and recommends requests and limits for CPU and memory. This reduces costs and improves performance.

  Features
  - No Agent Required: Robusta KRR is a CLI tool that runs on your local machine. It does not require running Pods in your cluster.
  - Prometheus Integration: Gather resource usage data using built-in Prometheus queries, with support for custom queries coming soon.
  - Extensible Strategies: Easily create and use your own strategies for calculating resource recommendations.
  - Future Support: Upcoming versions will support custom resources (e.g. GPUs) and custom metrics.
  - Resource Allocation Statistics

  According to a recent Sysdig study, on average, Kubernetes clusters have:

  - 69% unused CPU
  - 18% unused memory

  By right-sizing your containers with KRR, you can save an average of 69% on cloud costs.
publishedAt: 2023-05-25T17:00:00.000Z
technologies:
  - krr
show: rawkode-live
videoId: fd5l8yd2xbh033dpnkvftg35
---

