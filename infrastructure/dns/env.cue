package cuenv

import "github.com/cuenv/cuenv/schema"

schema.#Project

name: "infrastructure-dns"

let _infrastructure = [{allowInfrastructure: ["plan", "apply", "import", "destroy"]}]

env: {
	CLOUDFLARE_API_TOKEN: {
		value: schema.#OnePasswordRef & {ref: "op://Private/w3etxulw37bsqb2rsna5px7y4u/api-tokens/all-access"}
		policies: _infrastructure
	}
	DNSIMPLE_TOKEN: {
		value: schema.#OnePasswordRef & {ref: "op://Private/Dnsimple/api-token"}
		policies: _infrastructure
	}
	// TODO: create the Turso state database and point this at its token.
	TURSO_AUTH_TOKEN: {
		value: schema.#OnePasswordRef & {ref: "op://Private/Turso/infrastructure-dns/token"}
		policies: [{allowInfrastructure: ["plan", "apply", "import", "destroy", "state-list", "state-remove", "state-recover", "state-adopt", "unlock"]}]
	}
}
