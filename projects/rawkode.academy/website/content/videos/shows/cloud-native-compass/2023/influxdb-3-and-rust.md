---
id: influxdb-3-and-rust
slug: influxdb-3-and-rust
title: InfluxDB 3 & Rust
description: |-
  InfluxDB 3.0 Rewrite

  InfluxDB, a time series database, underwent a major rewrite to create InfluxDB 3.0, also known as IOx. The decision to rewrite the database was driven by the need for strict control over memory management and high performance. The project started as a research endeavor and gradually gained traction within the company. The team decided to build around projects under the Apache Foundation, such as Apache Arrow and Apache Data Fusion. In April 2022, InfluxDB 3.0 was officially announced, aiming to improve performance, scalability, and cost-effectiveness for users.

  IOx Database Engine

  The new database engine, IOx, is designed to handle various types of observability and monitoring data, including metrics, traces, and logs. It aims to provide a single store for all these signals, eliminating the need for separate databases. However, querying the data efficiently is still a challenge that the team is working on. The goal is to make IOx the go-to solution for storing and querying observational data, not only for server infrastructure monitoring but also for sensor data use cases.

  Challenges and Considerations

  Working with logs, tracing, and structured events in time series databases poses challenges. The dynamic and inconsistent nature of schemas in logs and tracing use cases can make extracting structured fields difficult. Time series databases also have limitations in handling tracing front ends and require an index to map trace IDs to individual traces. While metrics, logs, and traces are the gold standard for observability, there is room for improvement in terms of usability and performance.

  Flux and Data Fusion

  Flux, a scripting language developed for InfluxDB 2.0, addresses user requests for more complex query logic and integration with third-party systems. InfluxDB 3.0 incorporates a parser in Rust to translate SQL queries into a Data Fusion query plan, benefiting from the performance optimizations of Data Fusion. However, bringing Flux to InfluxDB 3.0 proved challenging due to the large surface area of Flux and limited time and resources. Updating the Flux engine to use the 3.0 native API could potentially resolve these issues.

  InfluxDB Development and Open Source Licensing

  InfluxData is focused on improving the core query engine of InfluxDB and enhancing its capabilities and performance. They have created a separate community fork of Flux to allow collaboration on its development. Paul Dix, the co-founder, believes that true open source should be about freedom and expresses his intention to keep InfluxDB 3 as a permissively licensed project. He discusses the recent license change by HashiCorp and the growing distrust in the developer community towards VC-backed open source projects. Putting InfluxDB into a foundation may not be feasible due to the lack of multiple contributors.

  00:00 Introduction
  02:00 Rewriting InfluxDB in Rust
  20:45 The Observability Database
  33:45 What the Flux?
  44:45 OpenSource & Licensing
  55:00 Shameless Plugs
publishedAt: 2023-11-08T17:00:00.000Z
technologies:
  - influxdb
  - rust
show: cloud-native-compass
videoId: tjd3afh6vpijjepecyc2c9j5
---

