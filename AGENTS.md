# Agent and Developer Guide for Using NX in This Monorepo

This document provides guidance on how to work with the NX monorepo setup.

## 1. Overview

This repository is managed as an [NX integrated monorepo](https://nx.dev/concepts/integrated-repos). NX helps manage dependencies, run tasks efficiently (with caching), and enforce consistency.

## 2. Common NX Commands

All `nx` commands should be run from the root of the monorepo.

### Running Tasks on a Specific Project
Use the pattern: `nx <target> <project-name> [options]`
- Example: `nx test rawkode-academy-platform-casting-credits`
- Example: `nx build rawkode-academy-website`
- Example: `nx deploy rawkode-academy-platform-rpc`

Common targets defined in `project.json` files include `build`, `test`, `lint`, `deploy`, `dev`, `start`, etc. Refer to individual `project.json` files for available targets for each project.

### Running Tasks on Affected Projects
NX excels at running tasks only on projects affected by your code changes.
- `nx affected:build`: Builds all projects affected by changes.
- `nx affected:test`: Tests all projects affected by changes.
- `nx affected:lint`: Lints all projects affected by changes.
- `nx affected:deploy`: (If you configure a deploy target for multiple projects)

These commands compare changes against a base commit (usually the `main` branch, as configured in `nx.json`).

### Visualizing the Project Graph
To see dependencies between projects:
```bash
nx graph
```
This opens an interactive graph in your browser.

## 3. Project Configuration

- Each project is defined by a `project.json` file in its root directory.
- These files specify targets (tasks) for the project.
- Targets often wrap existing Dagger functions (`dagger call ...`), Justfile commands (`just ...`), or scripts from `package.json`/`deno.jsonc`.

## 4. Workspace Generator: `new-service`

A custom generator is provided to scaffold new services. It is located in the `tools-generators` plugin.

**Command:**
```bash
nx generate tools-generators:new-service <service-name> --directory=<path-under-projects> --serviceType=<type> --tags="<comma-separated-tags>"
```

**Example:**
```bash
nx generate tools-generators:new-service my-cool-feature --directory=rawkode.academy/platform --serviceType=bun-dagger --tags="scope:platform,type:feature"
```

**Generator Options:**
-   `<service-name>`: The name of your new service (e.g., `user-notifications`). This will be kebab-cased for filenames.
-   `--directory`: Path under `projects/` where the service will be created (e.g., `rawkode.academy/platform`, `rawkode.chat`). The generator will create the service in `projects/<directory>/<service-name>`.
-   `--serviceType`: The archetype for the new service.
    -   `bun-dagger`: For services using Bun, TypeScript, and Dagger. Scaffolds a Dagger module, `project.json`, `package.json`, basic `src/`, `Justfile`, `biome.json`, `bunfig.toml`, and test setup.
    -   `deno-dagger`: For services using Deno, TypeScript, and Dagger. Scaffolds a Dagger module (wrapping Deno tasks), `project.json`, `deno.jsonc`, basic `src/`.
-   `--tags` (optional): Comma-separated tags for organizing the project in the NX graph (e.g., `scope:platform,type:api`).

## 5. Caching

NX caching is configured in `nx.json`.
-   Targets like `build`, `test`, `lint`, and `format` are generally configured to be cacheable.
-   `deploy`, `dev`, `start` targets are generally not cached.
-   Inputs affecting the cache include project source files, Dagger files (`dagger.json`, `.dagger/**/*`), relevant global configuration files (`package.json`, `nx.json`, `tsconfig.base.json`), and outputs from dependent tasks.

**To clear the cache:**
-   `nx reset`: Clears the NX daemon's cache and stops the daemon. This is useful if you suspect inconsistent behavior.
-   There isn't a direct `nx clear-cache` command for only file system cache without resetting the daemon. Deleting `.nx/cache` manually works but `nx reset` is safer.

## 6. Dagger Integration

-   Many project targets are configured to call Dagger functions (e.g., `dagger call ...`).
-   Ensure the `dagger` CLI is installed and available in your environment.
-   Shared Dagger modules (e.g., for Bun, Deno) are located in the root `dagger/` directory. Project-specific Dagger modules are within each project's `.dagger/` directory.

## 7. Toolchain Notes

-   **Root Package Manager**: The root `package.json` and its dependencies were initialized using `npm` due to environmental challenges with `bun` during the initial NX setup. For consistency, consider migrating the root to use `bun` as well if those issues are resolved in your development/CI environments.
-   **Project Package Managers**: Individual projects primarily use `bun` or `deno` as specified in their configurations and generator templates.
-   **Linting/Formatting**: [Biome](https://biomejs.dev/) is the standard linter and formatter for this workspace. ESLint and Prettier have been removed from the root configuration. Run `npx biome format --write .` and `npx biome lint .` from the root, or use project-specific format/lint targets if defined.

## 8. Viewing Project Details

To see configurations, including targets for a specific project:
```bash
nx show project <project-name>
```
Example: `nx show project rawkode-academy-platform-casting-credits`

This command provides a summary of the project's configuration, including its root, source root, tags, and defined targets.
```
