# Content Management

The content management system within the Rawkode Studio project is responsible for all data until it hits a consuming service. This includes:

- Data
  - Described as HCL in [data](./data)
- Database
  - Currently PostgreSQL on Neon
- CLI
  - Linting and validation
  - Sync (two-way) to database
- API
  - Exposed via Hasura

## Data

The data resides in [data](data). The data is split into four directories:

* [Episodes](data/episodes/)
* [People](data/people/)
* [Shows](data/shows/)
* [Technologies](data/technologies/)

The data exists to feed the YouTube channel of [Rawkode Academy](https://www.youtube.com/c/rawkode).

## Linter

The file linter resides in [linter](linter). When a file is valid, it exits with a status code of 0. When a file is invalid, it exits with a status code of 1 and prints the errors to standard error.

Supported file formats (links to their respective directories including examples):

* [Episodes](data/episodes/)
* [People](data/people/)
* [Shows](data/shows/)
* [Technologies](data/technologies/)

### Usage

To run the linter, use the following command:

```shell
cargo run --manifest-path=linter/Cargo.toml -- lint --path data/episodes/
```

To format all files, use the following command:

```shell
cargo run --manifest-path=linter/Cargo.toml -- format --path data/ [--apply]
```
