# Use an official Deno image
FROM denoland/deno:1.38.4

# Set the working directory in the container
WORKDIR /app

# Copy Deno configuration files
# An import_map.json is not yet created, but if it were, it should be copied.
# COPY import_map.json .
COPY deno.jsonc deno.lock ./

# Copy the source code for the service
COPY data-model ./data-model
COPY read-model ./read-model
COPY write-model ./write-model

# Cache dependencies. 
# The write-model/main.ts uses https://deno.land/std@0.207.0/uuid/mod.ts
# The read-model/main.ts does not have explicit external deps yet, but might in the future.
# Running deno cache on the main entry points or all .ts files can help.
# For now, specifically caching known dependencies or entry points.
# If an import_map.json was used and populated, `deno cache --import-map=import_map.json read-model/main.ts write-model/main.ts` would be good.
# Since import_map.json is not there, Deno will resolve from deno.jsonc if configured, or directly.
# Caching the main entry points.
RUN deno cache read-model/main.ts
RUN deno cache write-model/main.ts

# Expose a port if the service were to run an HTTP server (optional for now)
# EXPOSE 8000

# Default command to run the service (e.g., read model)
# This assumes that the read-model/main.ts is the primary entry point for this image.
# Adjust if there's a different main entry point or if arguments are needed.
CMD ["run", "--allow-read", "--allow-net", "read-model/main.ts"]
