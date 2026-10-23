package domains

import "github.com/rawkode-academy/rawkode-academy/infrastructure/dns/zone"

zones: "rawkode.live": zone.#CloudflareRegistrar & zone.#NoEmail & {
	id:  "d1cc4609351d014225f7da761779aa61"
	ttl: 300
	txt: "datum-custom-hostname": datum: {value: "de49ec01-b349-45d7-82f3-a7e8fd2d0c85", ttl: 3600}
}
