---
id: introduction-to-fleet-k3s-and-rancher
slug: introduction-to-fleet-k3s-and-rancher
title: Introduction to Fleet, k3s, & Rancher
description: |-
  In this episode, I am joined by Bastian Hofmann (Field Engineer at Rancher); Bastian will be introducing us to Fleet.

  Fleet is GitOps at scale. Fleet is designed to manage up to a million clusters. It's also lightweight enough that is works great for a single cluster too, but it really shines when you get to a large scale. By large scale we mean either a lot of clusters, a lot of deployments, or a lot of teams in a single organization.

  Fleet can manage deployments from git of raw Kubernetes YAML, Helm charts, or Kustomize or any combination of the three. Regardless of the source all resources are dynamically turned into Helm charts and Helm is used as the engine to deploy everything in the cluster. This give a high degree of control, consistency, and auditability. Fleet focuses not only on the ability to scale, but to give one a high degree of control and visibility to exactly what is installed on the cluster.

  K3s is a fully compliant Kubernetes distribution with the following enhancements:

      Packaged as a single binary.
      Lightweight storage backend based on sqlite3 as the default storage mechanism. etcd3, MySQL, Postgres also still available.
      Wrapped in simple launcher that handles a lot of the complexity of TLS and options.
      Secure by default with reasonable defaults for lightweight environments.
      Simple but powerful “batteries-included” features have been added, such as: a local storage provider, a service load balancer, a Helm controller, and the Traefik ingress controller.
      Operation of all Kubernetes control plane components is encapsulated in a single binary and process. This allows K3s to automate and manage complex cluster operations like distributing certificates.
      External dependencies have been minimized (just a modern kernel and cgroup mounts needed). K3s packages required dependencies, including:
          containerd
          Flannel
          CoreDNS
          CNI
          Host utilities (iptables, socat, etc)
          Ingress controller (traefik)
          Embedded service loadbalancer
          Embedded network policy controller


  🕰    Timeline

  00:00 - Holding screen
  02:20 - Introductions
  04:00 - Slides (What is Rancher, Fleet, k3s)
  14:00 - Starting to gets hands on - a look at our hardware
  14:50 - Installing single-node k3s on our first machine
  20:50 - Installing and playing with Rancher
  33:00 - Upgrading k3s clusters with Rancher
  39:30 - Installing a multi-node / HA k3s cluster with etcd
  45:20 - Using the Rancher integrated monitoring
  40:30 - GitOps workloads with Fleet

  1:16:00 - Recap




  💁🏻‍♂️    Want some help?

  💬  Leave a comment
  🐦  Ping me on Twitter - https://twitter.com/rawkode
  📆  Schedule some time during my office-hours - https://rawko.de/office-hours


  🌎    Links

  Bastian Hofmann - https://twitter.com/BastianHofmann
  Rancher - https://github.com/rancher/rancher
  Fleet - https://github.com/rancher/fleet
  k3s - https://github.com/rancher/k3s
publishedAt: 2020-10-01T17:00:00.000Z
technologies:
  - fleet
  - k3s
  - rancher
show: rawkode-live
videoId: lb438p217zya3imz0gaex2gb
---

