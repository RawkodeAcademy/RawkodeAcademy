---
id: monitoring-and-scaling-laravel-on-kubernetes
slug: monitoring-and-scaling-laravel-on-kubernetes
title: Monitoring & Scaling Laravel on Kubernetes
description: |-
  In this episode, we'll take a look at auto-scaling our Laravel application based on metrics.
  Please be aware, we couldn't find a working Prometheus library for Laravel that worked. We did successfully get external request metrics with Linkerd sidecar, but not custom metrics instrumented in PHP.
  #KubernetesTutorial #Tutorial


  🍿 Rawkode Live

  Hosted by David McKay / 🐦 https://twitter.com/rawkode
  Website: https://rawkode.live
  Discord Chat: https://rawkode.live/chat

  #RawkodeLive

  🕰 Timeline

  00:00 - Holding screen
  01:00 - Introductions
  03:50 - What did we do last time?
  16:30 - Installing siege
  19:50 - Creating the Horizontal Pod AutoScaler (HPA)
  24:40 - Deploying Metric Server
  32:00 - Triggering an AutoScale Event with siege
  46:00 - Adding Linkerd Sidecar for Request Metric Collection
  1:02:00 - Attempting to add Prometheus Middleware to Laravel

  👥 About the Guests

  Ciaran McNulty

    Ciaran helps teams at all levels of ability improve via training and 
  coaching. He has been a PHP professional since the late 90s and is 
  passionate about TDD, BDD and Agile methodologies. He is lead maintainer
   of PhpSpec.


  🐦 https://twitter.com/ciaranmcnulty
  🧩 https://github.com/ciaranmcnulty
  🌏 https://ciaranmcnulty.com


  Alex Bowers

    Alex is the Lead Developer at Shopblocks. Primarily working with Laravel, VueJS, and dabbling with Rust; Alex enjoys bridging his time between development and infrastructure with Ansible.


  🐦 https://twitter.com/bowersbros
  🧩 https://github.com/alexbowers



  🔨 About the Technologies

  Laravel

  Laravel is a web application framework with expressive, elegant syntax. A web framework provides a structure and starting point for creating your application, allowing you to focus on creating something amazing while we sweat the details.
  Laravel strives to provide an amazing developer experience, while providing powerful features such as thorough dependency injection, an expressive database abstraction layer, queues and scheduled jobs, unit and integration testing, and more.
  Whether you are new to PHP or web frameworks or have years of experience, Laravel is a framework that can grow with you.

  🌏 https://laravel.com
  🐦 https://twitter.com/laravelphp
  🧩 https://github.com/laravel/laravel

  #Laravel #PHP


  Kubernetes

  Kubernetes is a portable, extensible, open-source platform for managing containerized workloads and services, that facilitates both declarative configuration and automation. It has a large, rapidly growing ecosystem. Kubernetes services, support, and tools are widely 
  available.
  The name Kubernetes originates from Greek, meaning helmsman or pilot. Google open-sourced the Kubernetes project in 2014. Kubernetes combines over 15 years of Google's experience running production workloads at scale with best-of-breed ideas and practices from the community.
  Designed on the same principles that allows Google to run billions of containers a week, Kubernetes can scale without increasing your ops team.
  Whether testing locally or running a global enterprise, Kubernetes flexibility grows with you to deliver your applications consistently and easily no matter how complex your need is.
  Kubernetes is open source giving you the freedom to take advantage of on-premises, hybrid, or public cloud infrastructure, letting you effortlessly move workloads to where it matters to you.

  🌏 https://kubernetes.io/
  🐦 https://twitter.com/kubernetesio
  🧩 https://github.com/kubernetes/kubernetes

  #CloudNative #Kubernetes


  🌏 Show Links
  https://github.com/alexbowers/laravel-example-project
publishedAt: 2021-02-24T17:00:00.000Z
technologies:
  - kubernetes
  - laravel
  - php
show: rawkode-live
videoId: aby09ynwn40wa8dtsvxwf7ho
---

