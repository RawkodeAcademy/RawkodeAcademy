import { Construct } from "constructs";
import { ManagedDomain, Registrar } from "../dnsProvider";

export default (scope: Construct): ManagedDomain => {
	const managedDomain = new ManagedDomain(
		scope,
		"rawkode.win",
		Registrar.Cloudflare
	);

	managedDomain.discourageEmail();

	return managedDomain;
};
