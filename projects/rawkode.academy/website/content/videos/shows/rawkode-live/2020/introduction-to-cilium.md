---
id: introduction-to-cilium
slug: introduction-to-cilium
title: Introduction to Cilium
description: |-
  In this episode, joined by Ilya Dmitrichenko, we'll take a look at Cilium; a CNI implementation for Kubernetes, integrated with eBPF.

  Cilium is open source software for transparently securing the network connectivity between application services deployed using Linux container management platforms like Docker and Kubernetes.

  At the foundation of Cilium is a new Linux kernel technology called BPF, which enables the dynamic insertion of powerful security visibility and control logic within Linux itself. Because BPF runs inside the Linux kernel, Cilium security policies can be applied and updated without any changes to the application code or container configuration.

  🕰    Timeline

  00:00 - Holding screen
  03:05 - Introductions
  04:30 - Installing Cilium with the Quickstart
  08:50 - Running the Cilium connectivity tests
  11:50 - Connectivity test failures: IPAM range is full
  15:00 - Changing the IPv4 CIDR
  16:00 - Deleting the Cilium pods to force a config reload
  18:50 - Using the Cilium CLI to fetch Cilium status
  20:20 - Lets just delete everything and start again 😅
  26:30 - Lets try minikube ...
  30:30 - What is the Container Networking Interface (CNI)?
  35:00 - Advantages of Cilium
  39:30 - Deploying the Star Wars demo to our cluster
  41:00 - What is Hubble?
  42:00 - Back to Star Wars demo
  43:30 - Debugging Cilum Endpoints / What are Cilium Endpoints
  45:50 - Lets delete minikube and start again 😅
  48:00 - Now CoreDNS can't get an IP address 😀
  49:00 - Lets go back to our Packet cluster
  55:00 - Deploying Cilium again, this time with Helm
  58:00 - IPAM range is full 😅
  1:06:00 - Lets reboot all our nodes ...
  1:06:20 - Summary of what has gone wrong thus far
  1:16:00 - Lets delete Cilium node CRDs 
  1:17:00 - Cilium is working ... but DNS isn't 


  Part II coming soon!


  💁🏻‍♂️    Want some help?

  💬  Leave a comment
  🐦  Ping me on Twitter - https://twitter.com/rawkode
  📆  Schedule some time during my office-hours - https://rawko.de/office-hours


  🌎    Links

  Ilya Dmitrichenko - https://twitter.com/errordeveloper
  Cilium - https://cilium.io/
publishedAt: 2020-09-25T17:00:00.000Z
technologies:
  - cilium
show: rawkode-live
videoId: w6ui2iu1ib1yzoir8k1bolqa
---

