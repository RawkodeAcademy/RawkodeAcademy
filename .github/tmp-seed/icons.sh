#!/usr/bin/env bash
# Publishes content/technologies/<id>/icon.svg to the content CDN at the same
# path, with the id lowercased the way content ids are. Never touches logos/.
set -uo pipefail
root="$1"
w() { nix shell nixpkgs#bun nixpkgs#nodejs_24 -c env CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" bun x wrangler@4 "$@"; }
ok=0; failed=0; missing=""
for icon in "$root"/content/technologies/*/icon.svg; do
	id=$(basename "$(dirname "$icon")" | tr '[:upper:]' '[:lower:]')
	if w r2 object put "rawkode-academy-content/technologies/$id/icon.svg" --file "$icon" --content-type image/svg+xml --remote > /dev/null 2>&1; then ok=$((ok+1)); else failed=$((failed+1)); missing="$missing $id"; fi
done
served=0; notserved=""
for icon in "$root"/content/technologies/*/icon.svg; do
	id=$(basename "$(dirname "$icon")" | tr '[:upper:]' '[:lower:]')
	code=$(curl -s -o /dev/null -w "%{http_code}" "https://content.rawkode.academy/technologies/$id/icon.svg")
	case "$code" in 2*) served=$((served+1));; *) notserved="$notserved $id:$code";; esac
done
echo "::notice title=icons::uploaded $ok, failed $failed, served $served"
[ -n "$missing$notserved" ] && echo "::error title=icons not served::$missing $notserved"
[ "$failed" = 0 ] && [ -z "$notserved" ]
