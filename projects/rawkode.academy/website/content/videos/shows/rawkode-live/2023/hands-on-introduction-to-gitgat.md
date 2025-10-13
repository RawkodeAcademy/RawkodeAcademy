---
id: hands-on-introduction-to-gitgat
slug: hands-on-introduction-to-gitgat
title: Hands-on Introduction to GitGat
description: |-
  SCM (Source Control Management) security is of high importance as it serves as an entry point to the whole CI/CD pipeline. This repository contains policies that verify SCM (currently GitHub's) organization/repositories/user accounts security. The policies are evaluated using Open Policy Agent (OPA).

  There are different sets of policies depending on which account is being evaluated. Most policies are only relevant for organization owners. See the rulesets section bellow.

  The policies are evaluated against a certain state. When executed for the first time, the state is empty. The returned data should be reviewed, and the security posture should be manually evaluated (with recommendations from each module). If the state is approved, it should be added to the input data, so that the next evaluation of policies tracks the changes of the state. More information about the state configurable for each module is available in each module's corresponding section.
publishedAt: 2023-03-09T17:00:00.000Z
technologies: []
show: rawkode-live
videoId: ziso8d5pctrrqhxqeqbgvkfo
---

