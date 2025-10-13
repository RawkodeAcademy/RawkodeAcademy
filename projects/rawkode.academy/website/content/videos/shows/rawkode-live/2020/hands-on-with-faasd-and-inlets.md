---
id: hands-on-with-faasd-and-inlets
slug: hands-on-with-faasd-and-inlets
title: Hands-on with faasd & Inlets
description: |-
  faasd is OpenFaaS reimagined, but without the cost and complexity of Kubernetes. It runs on a single host with very modest requirements, making it fast and easy to manage. Under the hood it uses containerd and Container Networking Interface (CNI) along with the same core OpenFaaS components from the main project.

  When should you use faasd over OpenFaaS on Kubernetes?
  You have a cost sensitive project - run faasd on a 5-10 USD VPS or on your Raspberry Pi
  When you just need a few functions or microservices, without the cost of a cluster
  When you don't have the bandwidth to learn or manage Kubernetes
  To deploy embedded apps in IoT and edge use-cases
  To shrink-wrap applications for use with a customer or client
  faasd does not create the same maintenance burden you'll find with maintaining, upgrading, and securing a Kubernetes cluster. You can deploy it and walk away, in the worst case, just deploy a new VM and deploy your functions again.


  inlets® combines a reverse proxy and websocket tunnels to expose your internal and development endpoints to the public Internet via an exit-server. An exit-server may be a 5-10 USD VPS or any other computer with an IPv4 IP address. You can also tunnel services without exposing them on the Internet, making inlets a suitable replacement for a VPN.

  🕰 Timeline

  00:00 - Holding screen
  01:20 - Introductions
  10:15 - Installing faasd with cloud-init on Equinix Metal
  15:00 - Installing faasd manually
  17:00 - What is faasd?
  25:25 - Adding containers to faasd
  34:00 - Building our first FaaS function
  49:00 - Super fast cold starts with faasd
  57:50 - Introduction to inlets
  1:00:00 - Exposing a service with inlets and the inlets operator with arkade



  🌎 Resources

  Alex Ellis - https://twitter.com/alexellisuk
  OpenFaaS - https://www.openfaas.com/
  Faasd - https://github.com/openfaas/faasd
  Inlets - https://github.com/inlets/inlets
publishedAt: 2020-11-20T17:00:00.000Z
technologies:
  - inlets
  - openfaas
show: rawkode-live
videoId: mdv5rucpczre2hmjslcad38r
---

