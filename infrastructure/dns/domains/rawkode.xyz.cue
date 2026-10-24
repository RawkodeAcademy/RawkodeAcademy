package domains

import "github.com/rawkode-academy/rawkode-academy/infrastructure/dns/zone"

zones: "rawkode.xyz": zone.#CloudflareRegistrar & {
	id: "8b29d7b4ef4387e4dba95ab6f0dff408"
	txt: "datum-custom-hostname": datum: value: "9f28603e-a1b7-440b-ae10-365360a8fed3"
}
