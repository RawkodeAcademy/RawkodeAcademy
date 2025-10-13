---
id: kubernetes-security-with-identity-and-oidc
slug: kubernetes-security-with-identity-and-oidc
title: Kubernetes Security with Identity & OIDC
description: |-
  I interview Mark Boorshtein, the CTO of Tremolo Security, an open-source identity management company that focuses on authentication, authorization, identity, and automation. Mark explains that their most popular tool is Open Unison, which allows users to log in to their Kubernetes clusters with whatever authentication system they have, such as LDAP, AD, Okta, or Azure AD. Open Unison also provides secure access to the dashboard and integrates with other cluster management applications.

  Next up we shift over to the issue of certificate revocation in Kubernetes. Mark explains that Kubernetes doesn't know how to handle certificate revocation, which can be a security risk if a certificate is leaked or an employee leaves the company. He recommends using OpenID Connect or impersonation to access the cluster instead of relying on certificates. Mark also discusses the default time to live on service account tokens issued by the Kubernetes cluster and the importance of not using service account tokens when talking to clusters

  This episode provides insights into the challenges of identity management with Kubernetes and strives to help you improve the security of your Kubernetes clusters.

  (00:00) - Introductions
  (01:50) - The Problem with Identity and Kubernetes
  (12:45) - OIDC
  (21:15) - Enterprise Kubernetes
  (31:00) - Security & Supply Chain
  (37:40) - Shameless Plugs

  Host: David Flanagan, Rawkode Academy
  Guest: Marc Boorshtein, Tremolo Security
publishedAt: 2023-05-29T17:00:00.000Z
technologies:
  - kubernetes
show: cloud-native-compass
videoId: ratw2atcqa376ktfpvj2joo4
---

