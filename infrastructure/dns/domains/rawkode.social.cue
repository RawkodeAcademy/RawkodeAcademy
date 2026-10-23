package domains

import "github.com/rawkode-academy/rawkode-academy/infrastructure/dns/zone"

zones: "rawkode.social": zone.#CloudflareRegistrar & {
	id:  "b583535fe9918ae6f35945fcef628589"
	ttl: 300
	// Mastodon.
	a: "@": "94.23.75.107": {}
}
