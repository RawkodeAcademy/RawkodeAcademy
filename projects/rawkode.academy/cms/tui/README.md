# Rawkode Academy TUI CMS

A terminal user interface CMS for managing Rawkode Academy content.

## Features

- Browse and manage Videos, Episodes, People, Shows, and Technologies
- GraphQL API integration with api.rawkode.academy
- Keyboard navigation with tab switching between content types
- List view with search/filtering
- Detailed view for each item
- Built with Bubble Tea for smooth TUI experience

## Usage

```bash
go run .
```

## Keyboard Shortcuts

- `Tab` - Switch between content types
- `Enter` - Select item in list
- `Esc` / `b` - Go back
- `q` / `Ctrl+C` - Quit
- `j` / `↓` - Scroll down in detail view
- `k` / `↑` - Scroll up in detail view
- `/` - Filter list (built-in Bubble Tea feature)

## Building

```bash
go build -o tui-cms
```

## Development

The project is structured as follows:

- `main.go` - Main application and state management
- `list.go` - List view for browsing items
- `detail.go` - Detail view for individual items
- `form.go` - Form handling (for future create/edit functionality)
- `graphql.go` - GraphQL client and data models