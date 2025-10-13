---
id: hands-on-with-litmus-2-0
slug: hands-on-with-litmus-2-0
title: Hands-on with Litmus 2.0
description: |-
  In this episode, we take a look at the latest major release of Litmus: 2.0


  🍿 Rawkode Live

  Hosted by David McKay / 🐦 https://twitter.com/rawkode
  Website: https://rawkode.live
  Discord Chat: https://rawkode.live/chat

  #RawkodeLive

  🕰 Timeline

  00:00 - Holding screen
  01:00 - Introductions
  05:25 - What's new in Litmus 2.0?
  15:00 - Demo

  👥 About the Guests

  Karthik Satchitanand

    Karthik Satchitanand is one of the maintainers of the CNCF sandbox project LitmusChaos and a Co-Founder at ChaosNative. He is passionate about all things Kubernetes, and is generally interested in DevOps, storage performance/benchmarking & chaos engineering.


  🐦 https://twitter.com/ksatchit
  🧩 https://github.com/ksatchit



  🔨 About the Technologies

  Litmus

  Litmus is a toolset to do cloud-native chaos engineering. Litmus provides tools to orchestrate chaos on Kubernetes to help SREs find weaknesses in their deployments. SREs use Litmus to run chaos experiments initially in the staging environment and eventually in production to find bugs, vulnerabilities. Fixing the weaknesses leads to increased resilience of the system.
  Litmus takes a cloud-native approach to create, manage and monitor chaos. Chaos is orchestrated using the following Kubernetes Custom Resource Definitions (CRDs):
  - ChaosEngine: A resource to link a Kubernetes application or Kubernetes node to a - ChaosExperiment. ChaosEngine is watched by Litmus' Chaos-Operator which then invokes Chaos-Experiments
  - ChaosExperiment: A resource to group the configuration parameters of a chaos experiment. ChaosExperiment CRs are created by the operator when experiments are invoked by ChaosEngine.
  - ChaosResult: A resource to hold the results of a chaos-experiment. The Chaos-exporter reads the results and exports the metrics into a configured Prometheus server.


  🌏 https://litmuschaos.io/
  🐦 https://twitter.com/LitmusChaos
  🧩 https://github.com/litmuschaos/litmus
publishedAt: 2021-07-28T17:00:00.000Z
technologies:
  - litmus
show: rawkode-live
videoId: r6seigg9ay2yn6pwr591hbln
---

