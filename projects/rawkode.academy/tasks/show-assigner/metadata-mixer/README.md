# Video Metadata Browser

An interactive Rust CLI for browsing and editing video metadata from the Rawkode Academy GraphQL API.

## Setup

Set the following environment variables:
```bash
export LIBSQL_TOKEN="your-turso-token"
export LIBSQL_BASE="rawkodeacademy.aws-eu-west-1.turso.io"
```

## Usage

```bash
cargo run -- browse
```

## Features

- Fetches latest 500 videos from api.rawkode.academy/graphql
- Interactive TUI for browsing video metadata
- Visual indicators for missing metadata (show, guests, technologies)
- Show assignment with episode code entry
- Technology assignment with multi-select
- Keyboard navigation with hotkeys:
  - `j`/`↓`: Next video
  - `k`/`↑`: Previous video
  - `Space`: Jump to next video with missing metadata
  - `f`: Toggle filter (show only videos with missing metadata)
  - `s`: Edit show assignment (search shows and enter episode code)
  - `g`: Edit guest credits (multi-select from people list)
  - `t`: Edit technologies (multi-select from list)
  - `q`/`Esc`: Quit

## Show Assignment

When pressing `s`:
1. Search and select a show from the list
2. Enter an episode code (e.g., RESTATE1, K8S2, CNCF10)
3. The assignment is saved to the episodes database

## Technology Assignment

When pressing `t`:
1. Browse/search the full list of technologies
2. Toggle selection with Space or Enter
3. If technology not found, press Tab to create a new one
4. Press Esc to save and exit
5. Technology assignments are saved to the technologies database

### Creating New Technologies

When no matching technology is found:
1. Press Tab to enter creation mode
2. Type the technology name
3. Press Enter to create (ID is auto-generated from the name)
4. The new technology is automatically selected
5. Description, website, and docs can be added later

## Guest Assignment

When pressing `g`:
1. Browse/search the full list of people
2. Toggle selection with Space or Enter
3. If person not found, press Tab to create new
4. Press Esc to save and exit
5. Guest assignments are saved to the casting_credits database with role='guest'

### Creating New People

When no matching person is found:
1. Press Tab to enter creation mode
2. Enter forename, then press Enter
3. Enter surname, then press Enter to create
4. The new person is automatically selected
5. A unique ID is generated using cuid2 (collision-resistant unique identifiers)

## Building

```bash
cargo build --release
```

## Running the release build

```bash
./target/release/graphql-libsql-cli browse
```