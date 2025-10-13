---
id: introduction-to-litmus-chaos
slug: introduction-to-litmus-chaos
title: Introduction to Litmus Chaos
description: |-
  In this episode, we'll be guided through everything we need to know to get started with Litmus Chaos.


  🍿 Rawkode Live

  Hosted by David McKay / 🐦 https://twitter.com/rawkode
  Website: https://rawkode.live
  Discord Chat: https://rawkode.live/chat

  #RawkodeLive

  🕰 Timeline

  00:00 - Holding Screen
  00:30 - Introductions
  04:30 - What is Chaos Engineering & Litmus?
  19:00 - Questions
  28:45 - Demo Overview
  30:00 - Installing Litmus
  35:25 - Litmus Dashboard / UI / Hubs
  38:30 - Deploying our First Experiment
  54:35 - Kafka Chaos Experiment
  1:16:00 - Questions
  1:23:20 - Failing Chaos Demo

  👥 About the Guests

  Umasankar Mukkara

  Uma is passionate about promoting and innovating Chaos Engineering. He is a maintainer on LitmusChaos CNCF project and leads Chaos Native as its CEO.

  🐦 https://twitter.com/uma_mukkara
  🧩 https://github.com/umamukkara



  Karthik Satchitanand

  Karthik has been into Design and Development of tools for infrastructure as code, software testing performance & benchmarking & chaos engineering. Currently, he is one of the maintainers of the OpenEBS & Litmus opensource projects. In his free time, he learns about Indian classical music, philosophy & literature. 

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
publishedAt: 2021-03-03T17:00:00.000Z
technologies:
  - litmus
show: rawkode-live
videoId: oua0v79haem7e7klh0bwydsw
---

