FROM denoland/deno:2.2.4

WORKDIR /app

COPY . .

# Read Model
FROM base AS read-model
RUN deno cache read-model/main.ts
CMD ["deno", "run", "--allow-env", "--allow-net", "read-model/main.ts"]

# Write Model
FROM base AS write-model
RUN deno cache write-model/main.ts
CMD ["deno", "run", "--allow-env", "--allow-net", "write-model/main.ts"] 