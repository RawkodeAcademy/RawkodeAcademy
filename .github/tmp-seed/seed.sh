#!/usr/bin/env bash
# One-off platform content seed. MODE=dry-run: back up each database, build the
# seed into a local copy and report every existing row it would remove or
# change. MODE=apply: the same, then write the seed to production and verify.
set -uo pipefail
MODE="$1"
cd "$RUNNER_TEMP"
w() { nix shell nixpkgs#bun nixpkgs#nodejs_24 -c env CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID" bun x wrangler@4 "$@"; }
sq() { nix shell nixpkgs#sqlite -c sqlite3 "$@"; }
mkdir -p backup report

services="people:people:id technologies:technologies:id shows:shows:id videos:videos:id
video-guests:video_guests:video_id||'/'||guest_id
video-technologies:video_technologies:video_id||'/'||technology_id
show-hosts:show_hosts:show_id||'/'||host_id
episodes:episodes:videoId
chapters:chapters:video_id||'@'||seconds
people-links:people_links:person_id||'/'||url
people-biographies:people_biographies:person_id
transcription-terms:transcription_terms:kind||'/'||foreignId||'/'||term"

failed=0
summary=""
while read -r line; do
	[ -z "$line" ] && continue
	service="${line%%:*}"; rest="${line#*:}"; table="${rest%%:*}"; key="${rest#*:}"
	db="platform-$service"
	if ! w d1 export "$db" --remote --output "backup/$service.sql" > "report/$service-export.log" 2>&1; then
		echo "::error title=$service::backup failed: $(grep -i error "report/$service-export.log" | head -1)"; failed=1; continue
	fi
	rm -f old.db new.db
	sq old.db < "backup/$service.sql" 2> "report/$service-old.err"
	sq new.db < "backup/$service.sql" 2>/dev/null
	if ! sq -bail new.db < "seed/$service.sql" 2> "report/$service-seed.err"; then
		echo "::error title=$service::seed does not load locally: $(head -c 300 "report/$service-seed.err")"; failed=1; continue
	fi
	before=$(sq old.db "SELECT count(*) FROM $table")
	after=$(sq new.db "SELECT count(*) FROM $table")
	removed=$(sq new.db "ATTACH 'old.db' AS o; SELECT count(*) FROM (SELECT $key AS k FROM o.$table EXCEPT SELECT $key FROM main.$table)")
	changed=$(sq new.db "ATTACH 'old.db' AS o; SELECT count(*) FROM (SELECT * FROM o.$table EXCEPT SELECT * FROM main.$table)")
	added=$(sq new.db "ATTACH 'old.db' AS o; SELECT count(*) FROM (SELECT $key FROM main.$table EXCEPT SELECT $key AS k FROM o.$table)")
	sample=$(sq new.db "ATTACH 'old.db' AS o; SELECT group_concat(k, ' ') FROM (SELECT $key AS k FROM o.$table EXCEPT SELECT $key FROM main.$table ORDER BY 1 LIMIT 40)")
	echo "::notice title=$service::rows $before -> $after; added $added; removed $removed; rewritten $((changed - removed))"
	[ "$removed" != "0" ] && echo "::warning title=$service removed::$sample"
	summary="$summary $service=$before->$after"

	if [ "$MODE" = "apply" ]; then
		if w d1 execute "$db" --remote --yes --file "seed/$service.sql" > "report/$service-exec.log" 2>&1; then
			n=$(w d1 execute "$db" --remote --json --command "SELECT count(*) AS n FROM $table" 2>/dev/null | sed -n '/^\[/,$p' | jq -r '.[0].results[0].n')
			[ "$n" = "$after" ] && echo "::notice title=$service applied::$n rows" || { echo "::error title=$service applied::expected $after rows, found $n"; failed=1; }
		else
			echo "::error title=$service apply::$(grep -iv '^copying path' "report/$service-exec.log" | grep -i 'error\|✘' | head -2 | tr '\n' ' ')"; failed=1
		fi
	fi
done <<< "$services"
echo "::notice title=summary ($MODE)::$summary"
exit $failed
