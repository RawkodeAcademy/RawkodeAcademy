---
id: ipv6-only-kubernetes-clusters-rtfm-with-rawkode
slug: ipv6-only-kubernetes-clusters-rtfm-with-rawkode
title: IPv6 ONLY Kubernetes Clusters (RTFM with Rawkode)
description: |-
  In this episode, joined by Arian van Putten, we take a look at the steps involved for creating / provisioning an IPv6 ONLY Kubernetes cluster on Packet.

  Leveraging kubeadm and Calico CNI, and BGP; Arian walks me through the steps to get our Kubernetes cluster singing to IPv6.

  Internet Protocol version 6 (IPv6) is the most recent version of the Internet Protocol (IP), the communications protocol that provides an identification and location system for computers on networks and routes traffic across the Internet. IPv6 was developed by the Internet Engineering Task Force (IETF) to deal with the long-anticipated problem of IPv4 address exhaustion. IPv6 is intended to replace IPv4. In December 1998, IPv6 became a Draft Standard for the IETF, who subsequently ratified it as an Internet Standard on 14 July 2017.

  Kubeadm is a tool built to provide best-practice "fast paths" for creating Kubernetes clusters. It performs the actions necessary to get a minimum viable, secure cluster up and running in a user friendly way. Kubeadm's scope is limited to the local node filesystem and the Kubernetes API, and it is intended to be a composable building block of higher level tools.

  Calico is an open source networking and network security solution for containers, virtual machines, and native host-based workloads. Calico supports a broad range of platforms including Kubernetes, OpenShift, Docker EE, OpenStack, and bare metal services.

  Border Gateway Protocol (BGP) is a standardized exterior gateway protocol designed to exchange routing and reachability information among autonomous systems (AS) on the Internet. BGP is classified as a path-vector routing protocol, and it makes routing decisions based on paths, network policies, or rule-sets configured by a network administrator. 


  🕰    Timeline

  00:00 - Holding screen
  01:30 - Introductions
  04:40 - Why are we deploying an IPv6 ONLY Kubernetes cluster?
  09:40 - Is this secure?!
  11:50 - Tutorial begins
  13:55 - Creating our servers with Pulumi and TypeScript
  30:00 - Refactoring server provisioning with TypeScript (Why I love Pulumi)
  34:00 - Installing Kubernetes with kubeadm
  49:30 - Installing CNI Calico
  59:30 - Deploying nginx
  1:00:00 - Announcing Kubernetes pod IPv6 addresses with BGP
  1:11:16 - Announcing Kubernetes service IPv6 addresses with BGP


  💁🏻‍♂️    Want some help?

  💬  Leave a comment
  🐦  Ping me on Twitter - https://twitter.com/rawkode
  📆  Schedule some time during my office-hours - https://rawko.de/office-hours


  🌎    Links

  Arian van Putten - https://twitter.com/ProgrammerDude
  Packet - https://www.packet.com
  Calico - https://www.projectcalico.org/
publishedAt: 2020-09-08T17:00:00.000Z
technologies:
  - kubernetes
show: rawkode-live
videoId: qzf07xf4d395p3bm5ugkqxp0
---

