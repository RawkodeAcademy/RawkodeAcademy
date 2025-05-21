# Live Events Service

The Live Events Service is responsible for managing and providing information about upcoming live video streams on the Rawkode Academy platform.

## Overview

This service allows for the creation, updating, deletion, and listing of live events. It is built with Deno and TypeScript. Currently, the service operates as command-line scripts for its read and write operations, with data persisted in memory for demonstration purposes. Future development will include database integration and an HTTP API.

## Directory Structure

-   `/data-model`: Contains the TypeScript interface (`schema.ts`) defining the `LiveEvent` data structure.
-   `/read-model`: Contains the script (`main.ts`) for querying and listing upcoming live events.
-   `/write-model`: Contains the script (`main.ts`) for creating, updating, and deleting live events.
-   `/`: Contains Deno configuration (`deno.jsonc`, `deno.lock`), the `Dockerfile` for containerization, and this `README.md`.

## Technology Stack

-   **Runtime**: [Deno](https://deno.land/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Containerization**: [Docker](https://www.docker.com/)

## Data Model (`data-model/schema.ts`)

The core data entity is `LiveEvent`, defined with fields such as:
-   `id: string` (UUID)
-   `title: string`
-   `description: string`
-   `start_time: Date`
-   `end_time: Date`
-   `stream_url: string`
-   `created_at: Date`
-   `updated_at: Date`

## Running the Service

### Using Deno

**Prerequisites**:
-   [Deno](https://deno.land/manual/getting_started/installation) installed.

**1. Read Model (List Upcoming Live Streams):**
   The read model script will output a list of upcoming live events (currently using mock data).

   ```bash
   deno run --allow-read --allow-net read-model/main.ts
   ```
   *(Note: `--allow-net` is included for potential future external dependencies or if Deno needs to resolve modules; `--allow-read` is for accessing local files like the schema.)*

**2. Write Model (Manage Live Streams):**
   The write model script demonstrates creating, updating, and deleting live events (currently using an in-memory mock store).

   ```bash
   deno run --allow-read --allow-net --allow-env write-model/main.ts
   ```
   *(Note: `--allow-env` might be needed for some libraries that access environment variables, `--allow-net` for the UUID module from deno.land/std)*

**3. Running Tests:**
   Unit tests are available for both read and write models.

   ```bash
   deno test --allow-read --allow-net --allow-env
   ```
   *(Grant necessary permissions for tests; they import modules and might involve file system or network access for dependencies).*

### Using Docker

**Prerequisites**:
-   [Docker](https://docs.docker.com/get-docker/) installed.

**1. Build the Docker Image:**
   Navigate to the `projects/rawkode.academy/platform/live-events-service/` directory.

   ```bash
   docker build -t rawkode/live-events-service .
   ```

**2. Run the Docker Container:**
   The default command in the Dockerfile runs the read model.

   ```bash
   docker run rawkode/live-events-service
   ```
   This will execute `read-model/main.ts` inside the container. To run other models or commands, you would need to override the Docker `CMD` or use `docker exec`.

## API Overview (Conceptual)

The service functionalities are currently exposed as functions within the Deno scripts rather than an HTTP API.

### Read Model (`read-model/main.ts`)

-   **`getUpcomingLiveEvents(): Promise<LiveEvent[]>`**
    -   Fetches all live events scheduled to start in the future.
    -   Events are sorted by their `start_time` in ascending order.
    -   Currently uses mock data.

### Write Model (`write-model/main.ts`)

-   **`createLiveEvent(data: Omit<LiveEvent, 'id' | 'created_at' | 'updated_at'>): Promise<LiveEvent>`**
    -   Creates a new live event.
    -   Assigns a unique `id`, `created_at`, and `updated_at` timestamp.
    -   Returns the created event.
    -   Currently uses an in-memory mock store.

-   **`updateLiveEvent(id: string, data: Partial<Omit<LiveEvent, 'id' | 'created_at' | 'updated_at'>>): Promise<LiveEvent | null>`**
    -   Updates an existing live event identified by its `id`.
    -   Updates the `updated_at` timestamp.
    -   Returns the updated event, or `null` if the event is not found.
    -   Currently uses an in-memory mock store.

-   **`deleteLiveEvent(id: string): Promise<boolean>`**
    -   Deletes a live event identified by its `id`.
    -   Returns `true` if deletion was successful, `false` otherwise (e.g., event not found).
    -   Currently uses an in-memory mock store.

## Future Development

-   Integration with a persistent database (e.g., PostgreSQL) using Drizzle ORM.
-   Exposing service functionalities via an HTTP API (e.g., using Oak or a similar Deno framework).
-   More comprehensive error handling and input validation.
-   Implementation of `import_map.json` for dependency management.
