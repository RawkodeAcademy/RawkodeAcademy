FROM docker.io/denoland/deno:2.0.6 AS build

COPY deno.jsonc deno.lock .
RUN deno install

COPY . .
RUN deno compile \
	--allow-net \
	--allow-env=LIBSQL_TOKEN,LIBSQL_BASE_URL \
	--output episodes-read-model \
	read-model/main.ts

FROM cgr.dev/chainguard/bash

EXPOSE 8000
WORKDIR /app

COPY --from=build /episodes-read-model /

CMD [ "/episodes-read-model" ]
