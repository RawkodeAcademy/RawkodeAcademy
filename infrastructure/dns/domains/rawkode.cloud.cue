package domains

import "github.com/rawkode-academy/rawkode-academy/infrastructure/dns/zone"

zones: "rawkode.cloud": zone.#CloudflareRegistrar & zone.#NoEmail & {
	id: "74966f6182319530ff6e643516300350"
	a: {
		"@": "62.210.216.62": ttl: 60
		"*": "62.210.216.52": {}
		teleport: "62.210.216.62": {}
		"*.teleport": "62.210.216.62": {}
	}
	txt: "@": spf: ttl: 300
}
