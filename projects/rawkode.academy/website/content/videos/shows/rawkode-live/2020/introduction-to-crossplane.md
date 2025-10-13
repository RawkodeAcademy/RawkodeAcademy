---
id: introduction-to-crossplane
slug: introduction-to-crossplane
title: Introduction to Crossplane
description: |-
  Crossplane, a Cloud Native Computing Foundation sandbox project, is an open source Kubernetes add-on that extends any cluster with the ability to provision and manage cloud infrastructure, services, and applications using kubectl, GitOps, or any tool that works with the Kubernetes API.

  With Crossplane you can:

  - Provision & manage cloud infrastructure with kubectl
    - Install Crossplane to provision and manage cloud infrastructure and services from any Kubernetes cluster.
    - Provision infrastructure primitives from any provider (GCP, AWS, Azure, Alibaba, on-prem) and use them alongside existing application configurations.
    - Version, manage, and deploy with your favorite tools and workflows that you’re using with your clusters today.

  - Publish custom infrastructure resources for your applications to use
    - Define, compose, and publish your own infrastructure resources with declarative YAML, resulting in your own infrastructure CRDs being added to the Kubernetes API for applications to use.
    - Hide infrastructure complexity and include policy guardrails, so applications can easily and safely consume the infrastructure they need, using any tool that works with the Kubernetes API.
    - Consume infrastructure resources alongside any Kubernetes application to provision and manage the cloud services they need with Crossplane as an add-on to any Kubernetes cluster.

  - Deploy applications using a team-centric approach with OAM
    - Define cloud native applications and the infrastructure they require with the Open Application Model (OAM).
    - Collaborate with a team-centric approach with a strong separation of concerns:
      - Infrastructure operators - provide infrastructure and services for applications to consume
      - Application developers - build application components independent of infrastructure
      - Application operators - compose, deploy, and run application configurations
    - Deploy application configurations from app delivery pipelines or GitOps workflows, using the proven Kubernetes declarative model.


  🕰 Timeline

  00:00 - Holding Screen
  01:20 - Introductions
  02:20 - What is Crossplane?
  09:40 - Does Crossplane compete or complement tools like Terraform and Pulumi?
  14:00 - Installing Crossplane
  20:00 - Installing the Equinix Metal provider
  32:00 - Deploying a Crossplane Configuration
  45:00 - Deploying a Device with a CRD
  51:00 - Provisioning the Device
  1:02:00 - Looking at the spec to deploy Tinkerbell
  1:07:00 - What is Equinix / Equinix Fabric?



  🌎 Resources

  Daniel Mangum - https://twitter.com/stefanprodan
  Marques Johansson - https://twitter.com/displague
  Crossplane - https://crossplane.io/
  Equinix Metal Crossplane Provider - https://github.com/packethost/crossplane-provider-equinix-metal
  Equinix Fabric - https://metal.equinix.com/developers/docs/networking/fabric
publishedAt: 2020-10-14T17:00:00.000Z
technologies:
  - crossplane
show: rawkode-live
videoId: gh80b8535py01j2wjsqlc12z
---

