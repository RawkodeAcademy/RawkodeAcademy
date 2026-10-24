package cuenv

import (
	"github.com/rawkode-academy/rawkode-academy/infrastructure/dns/domains"
	"registry.terraform.io/cloudflare/cloudflare:cloudflare_provider"
	"registry.terraform.io/dnsimple/dnsimple:dnsimple_provider"
)

infrastructure: {
	// TODO: replace with the ID `wrangler d1 create infrastructure-dns` prints.
	state: d1: {
		accountId:  "0aeb879de8e3cdde5fb3d413025222ce"
		databaseId: "00000000-0000-0000-0000-000000000000"
		token:      _cloudflareToken
	}

	providers: {
		cloudflare: cloudflare_provider.#Provider
		dnsimple: dnsimple_provider.#Provider & {
			configuration: account: "126046"
		}
	}

	resources: {for _, zone in domains.zones {zone.resources}}
}
