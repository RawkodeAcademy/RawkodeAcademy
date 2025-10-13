---
id: introduction-to-opentelemetry
slug: introduction-to-opentelemetry
title: Introduction to OpenTelemetry
description: |-
  Special Guests: Amy Tobey (https://twitter.com/MissAmyTobey)
   and Liz Fong-Jones (https://twitter.com/lizthegrey)

  Amy has worked in web operations for more than 20 years at companies of every size, touching everything from kernel code to user interfaces. When she's not working she can usually be found around her home in San Jose, caring for her family, making music, or doing yoga in the sun.

  Liz is a developer advocate, labor and ethics organizer, and Site Reliability Engineer (SRE) with 16+ years of experience. She is an advocate at Honeycomb for the SRE and Observability communities, and previously was an SRE working on products ranging from the Google Cloud Load Balancer to Google Flights.

  OpenTelemetry is an observability framework - software and tools that assist in generating and capturing telemetry data from cloud-native software.

  What is an Observability Framework?

  OpenTelemetry provides the libraries, agents, and other components that you need to capture telemetry from your services so that you can better observe, manage, and debug them. Specifically, OpenTelemetry captures metrics, distributed traces, resource metadata, and logs (logging support is incubating now) from your backend and client applications and then sends this data to backends like Prometheus, Jaeger, Zipkin, and others for processing. OpenTelemetry is composed of the following:

  - One API and SDK per language, which include the interfaces and implementations that define and create distributed traces and metrics, manage sampling and context propagation, etc.
  - Language-specific integrations for popular web frameworks, storage clients, RPC libraries, etc. that (when enabled) automatically capture relevant traces and metrics and handle context propagation
  - Automatic instrumentation agents that can collect telemetry from some applications without requiring code changes
  - Language-specific exporters that allow SDKs to send captured traces and metrics to any supported backends
  - The OpenTelemetry Collector, which can collect data from OpenTelemetry SDKs and other sources, and then export this telemetry to any supported backend

  OpenTelemetry is a CNCF Sandbox member, formed through a merger of the OpenTracing and OpenCensus projects.

  🕰 Timeline

  00:00 - Holding screen
  01:00 - Introductions
  02:30 - What is OpenTelemetry?
  04:50 - What was setup in advance
  07:30 - Looking at an OpenTelemetry example
  11:30 - Adding the gRPC interceptors
  16:20 - Adding the OpenTelemetry initialisation code and stdout exporter
  24:45 - Triggering our first trace
  26:10 - Adding the Honeycomb exporter
  41:30 - Adding additional context to our traces
  59:40 - Adding extra spans / instrumenting database calls


  🌎 Resources

  Amy Tobey - https://twitter.com/MissAmyTobey
  Liz Fong-Jones - https://twitter.com/lizthegrey
  OpenTelemetry - https://opentelemetery.io
  Honeycomb - https://honeycomb.io
  Tinkerbell - https://tinkerbell.org
publishedAt: 2020-11-03T17:00:00.000Z
technologies:
  - opentelemetry
show: rawkode-live
videoId: qsajojlbooovvzl4r05aabx8
---

