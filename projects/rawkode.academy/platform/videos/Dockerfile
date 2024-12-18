FROM docker.io/denoland/deno:2.1.4 AS base

WORKDIR /app

COPY deno.jsonc deno.lock ./
RUN deno install

FROM base AS read-model

EXPOSE 8000

COPY ./read-model read-model

RUN deno cache ./read-model/main.ts

CMD ["run", "--allow-all", "./read-model/main.ts"]
