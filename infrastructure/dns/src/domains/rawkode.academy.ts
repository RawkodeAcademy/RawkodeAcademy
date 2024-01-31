import { Construct } from "constructs";
import { ManagedDomain, Registrar } from "../dnsProvider";

export default (scope: Construct): ManagedDomain => {
	const managedDomain = new ManagedDomain(
		scope,
		"rawkode.academy",
		Registrar.Cloudflare,
	);

	managedDomain
		.enableGSuite({
			domainKey:
				"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0htq+un78kY5mLFMLYmkb0Dl9uzX5P0RwhwY6ADVCpL+SI7zZYOyY4uPpRq44nm+H1iqet8wfjLlvnn1VrxB5ivwJisNsaleMZnkNPPXOZ+Y9lDFxqQLHUBzEB3dmHm7/HD2wcEHiConR2CFZ7888dDfMoBzpCifGdqDPsGJR2vCVNYHPDvd9fs6wwZQszJASWWxeMWV1U7rN9GqPHBMvgGJ4HfyWqOPrGEzWAdJ8+y98fhzDchejEnFOP7AtccqifoM7jpOwRDitjW+RL6gofYOJrJG48lSFSSEw25KWQ6yqEaT/Q1cXzIyOsvXuMNQ9UcPUpg8jDboor9vj852dwIDAQAB",
			spfIncludes: [],
		})
		.addTextRecord(
			"google-site-verification",
			"@",
			"google-site-verification=dlh9jxVzubowYFoVO82naJOotuUwY8zNG2VYGWlDhsU",
		)
		.addARecord("web", "@", "185.230.63.107")
		.addCNameRecord("www", "www", "pointing.wixdns.net")
		.addTextRecord(
			"_atproto",
			"_atproto",
			"did=did:plc:qtpysarntxepux4to4dr4hgr",
		)
		.addCNameRecord("kinde", "account", "eu.kinde.com")
		.addCNameRecord(
			"kinde-acme",
			"_acme-challenge.account",
			"_acme-challenge.37cee9a3f2a9e8c5d33d593eefcf51c6.rawkode.kinde.com",
		);

	return managedDomain;
};
