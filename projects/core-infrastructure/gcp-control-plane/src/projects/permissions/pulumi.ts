import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { IAMCustomRole } from "@pulumi/gcp/projects";

interface PulumiProjectArgs {
	gcpProject: string;
}

export class PulumiProject extends pulumi.ComponentResource {
	static cloudKmsRole: IAMCustomRole;
	static secretsManagerRole: IAMCustomRole;
	static storageRole: IAMCustomRole;

	constructor(
		name: string,
		args: PulumiProjectArgs,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super("rawkode:project:pulumi", name, {}, opts);
	}

	static createRoles(args: PulumiProjectArgs) {}
}
