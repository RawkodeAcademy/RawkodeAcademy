import * as pulumi from "@pulumi/pulumi";

export class PulumiIntegration extends pulumi.ComponentResource {
	constructor() {
		super("rawkode:ControlPlane:PulumiIntegration", "pulumi", {}, {});
	}
}
