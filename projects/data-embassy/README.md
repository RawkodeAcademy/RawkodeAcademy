# Data Embassy

**Status**: Prototype

This is an early experiment with the Rawkode Academy data, so please don't rely on anything provided as is for now.

## Goal

This project serves to make the Rawkode Academy's Git based data available to anyone who wants to use it.

This could be a guest on the Rawkode Academy that wishes to update their profile, or even a content aggregator that wishes to share the Rawkode Academy content.

### Objectives

#### Define a Schema for the Data

This is done via CUE, though we're using a project called [CueBlox](https://github.com/cueblox/blox) that adds a DB layer on top, providing validations with referential integrity and GraphQL.

You can find the [schema here](./schemata/).

#### Published Shema

We aim to convert the CUE based schemata to JSON Schema and make it available at [https://schema.rawkode.academy](https://schema.rawkode.academy), but this hasn't been started yet.

#### Provide the Data over an API

This data will be available publicly via GraphQL, with REST potentially added in the future.

Once we get this live, it should be at [https://api.rawkode.academy](https://api.rawkode.academy).
