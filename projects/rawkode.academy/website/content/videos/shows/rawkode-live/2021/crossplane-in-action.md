---
id: crossplane-in-action
slug: crossplane-in-action
title: Crossplane in Action
description: |-
  In this episode, Viktor guides us through a complete demo of Crossplane in action.


  🍿 Rawkode Live

  Hosted by David McKay / 🐦 https://twitter.com/rawkode
  Website: https://rawkode.live
  Discord Chat: https://rawkode.live/chat

  #RawkodeLive

  🕰 Timeline

  00:00 - Holding screen

  👥 About the Guests

  Viktor Farcic

    Developer Advocate at @upbound_io


  🐦 https://twitter.com/vfarcic
  🧩 https://github.com/vfarcic



  🔨 About the Technologies

  Crossplane

  Crossplane is an open source Kubernetes add-on that enables platform teams to assemble infrastructure from multiple vendors, and expose higher level self-service APIs for application teams to consume. Crossplane effectively enables platform teams to quickly put together their own opinionated platform declaratively without having to write any code, and offer it to their application teams as a self-service Kubernetes-style declarative API.
  Both the higher level abstractions as well as the granular resources they are composed of are represented simply as objects in the Kubernetes API, meaning they can all be provisioned and managed by kubectl, GitOps, or any tools that can talk with the Kubernetes API. To facilitate reuse and sharing of these APIs, Crossplane supports packaging them in a standard OCI image and distributing via any compliant registry.
  Platform engineers are able to define organizational policies and guardrails behind these self-service API abstractions. The developer is presented with the limited set of configuration that they need to tune for their use-case and is not exposed to any of the complexities of the low-level infrastructure below the API. Access to these APIs is managed with Kubernetes-native RBAC, thus enabling the level of permissioning to be at the level of abstraction.
  While extending the Kubernetes control plane with a diverse set of vendors, resources, and abstractions, Crossplane recognized the need for a single consistent API across all of them. To this end, we have created the Crossplane Resource Model (XRM). XRM extends the Kubernetes Resource Model (KRM) in an opinionated way, resulting in a universal experience for managing resources, regardless of where they reside. When interacting with the XRM, things like credentials, workload identity, connection secrets, status conditions, deletion policies, and references to other resources work the same no matter what provider or level of abstraction they are a part of.

  🌏 https://crossplane.io/
  🐦 https://twitter.com/crossplane_io
  🧩 https://github.com/crossplane/crossplane

  #IaaC
publishedAt: 2021-09-09T17:00:00.000Z
technologies:
  - crossplane
show: rawkode-live
videoId: i3y48lfgt09qvoupcis4dkov
---

