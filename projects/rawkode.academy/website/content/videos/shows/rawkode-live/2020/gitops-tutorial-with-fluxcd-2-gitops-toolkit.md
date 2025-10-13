---
id: gitops-tutorial-with-fluxcd-2-gitops-toolkit
slug: gitops-tutorial-with-fluxcd-2-gitops-toolkit
title: GitOps Tutorial with FluxCD 2 (GitOps Toolkit)
description: |-
  GitOps is a way to do Kubernetes cluster management and application delivery.  It works by using Git as a single source of truth for declarative infrastructure and applications. With GitOps, the use of software agents can alert on any divergence between Git with what's running in a cluster, and if there's a difference, Kubernetes reconcilers automatically update or rollback the cluster depending on the case. With Git at the center of your delivery pipelines, developers use familiar tools to make pull requests to accelerate and simplify both application deployments and operations tasks to Kubernetes.

  The GitOps Toolkit is a set of composable APIs and specialized tools that can be used to build a Continuous Delivery platform on top of Kubernetes.

  These tools are build with Kubernetes controller-runtime libraries, and they can be dynamically configured with Kubernetes custom resources either by cluster admins or by other automated tools. The GitOps Toolkit components interact with each other via Kubernetes events and are responsible for the reconciliation of their designated API objects.


  🕰 Timeline


  00:00 - Holding Screen
  01:25 - Introductions
  02:00 - What is GitOps / GitOps Toolkit?
  05:00 - Should I use Flux v1 or GitOps Toolkit?
  07:45 - Bootstrapping GitOps Toolkit
  15:00 - What are the GitOps Toolkit components?
  17:40 - GitOps Toolkit CRDs
  21:00 - Suspending reconciliation
  23:30 - Deploying our first workload
  27:10 - Questions
  34:30 - Add another GitRepository
  43:30 - Dependencies and health-checks
  59:20 - Deploying Helm charts
  1:09:00 - Final questions



  🌎 Resources


  Stefan Prodan - https://twitter.com/stefanprodan
  GitOps Toolkit Soruce - https://github.com/fluxcd/toolkit
  GitOps Toolkit Docs - https://toolkit.fluxcd.io
  Walkthrough - https://gist.github.com/stefanprodan/1f5e0b31303a95885221e5c7733fc639
publishedAt: 2020-10-13T17:00:00.000Z
technologies:
  - fluxcd
show: rawkode-live
videoId: fhspicv0ccs7sce6vc047vt3
---

