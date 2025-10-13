---
id: managing-linux-in-real-time-with-saltstack
slug: managing-linux-in-real-time-with-saltstack
title: Managing Linux in Real Time with SaltStack
description: |-
  In this episode, joined by my colleague Edward Vielmetti, we go through the installation and configuration of a SaltStack cluster for managing a heterogeneous collection of systems.


  SaltStack (often referred to as just Salt) is Python-based, open-source software for event-driven IT automation, remote task execution, and configuration management. Supporting the "Infrastructure as Code" approach to data center system and network deployment and management, configuration automation, SecOps orchestration, vulnerability remediation, and hybrid cloud control. 


  🕰    Timeline

  00:00 - Holding Screen
  02:00 - Introductions
  05:00 - Deploying a heterogeneous cluster (Machines and OS) with SaltStack on Packet’s bare metal with Pulumi and TypeScript
  17:30 - Extending SaltStack with Packet’s metadata as grains
  18:30 - Covering SaltStack’s Vocabulary: Grains and Pillars
  22:30 - Binding SaltStack to the private IPv4 address
  24:00 - Ed has a cool use-case for Tailscale, connecting his SaltStack nodes over disparate private networks
  26:30 - Connecting to our SaltStack master / Checking it works!
  28:00 - Approving our first minion key
  29:20 - Oops! Our provisioning on the CentOS machine failed. Lets fix it (Fuck you, Python 2)
  37:00 - Introduction to SaltStack CLI
  38:20 - Executing remote commands on minions
  39:00 - Targeting minions
  40:00 - Querying grains
  52:00 - Fixing the Ubuntu machine (Fuck you, Python 2)
  56:10 - SaltStack communication method. Spoiler: event driven through zero-mq
  58:40 - Python / wheel on Arm needs compiled, so it’s a bit slower.
  59:30 - Installing software to our minions through SaltStack’s package module
  1:07:00 - Looking at state modules
  1:09:00 - Writing our first state using the cron state module
  1:13:00 - Running a single state from the file root
  1:14:00 - Adding the file state module to our first state: creating a directory and writing a file
  1:26:45 - Provisioning all our machines with SSH keys from our custom grain data


  💁🏻‍♂️    Want some help?

  💬  Leave a comment
  🐦  Ping me on Twitter - https://twitter.com/rawkode
  📆  Schedule some time during my office-hours - https://rawko.de/office-hours


  🌎    Links

  Edward Vielmetti - https://twitter.com/w8emv
  SaltStack - https://saltstack.com
  Packet - https://packet.com
publishedAt: 2020-09-17T17:00:00.000Z
technologies:
  - salt
show: rawkode-live
videoId: akvx71sbz8fsyk50yhcde4vz
---

