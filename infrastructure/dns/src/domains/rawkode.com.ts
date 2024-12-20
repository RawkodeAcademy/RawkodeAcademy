import { Construct } from "constructs";
import { ManagedDomain, Registrar } from "../dnsProvider";

export default (scope: Construct): ManagedDomain => {
	const managedDomain = new ManagedDomain(
		scope,
		"rawkode.com",
		Registrar.Cloudflare,
	)
		.enableMicrosoft365({
			txtVerification: "MS=ms10141430",
		})
		.addTextRecord(
			"google-site-verification",
			"@",
			"google-site-verification=tLlIPrsVkjMI2Klec6nYm_m6bNNwKOgvQZlyyxg0nBQ",
		);

	return managedDomain;
};
