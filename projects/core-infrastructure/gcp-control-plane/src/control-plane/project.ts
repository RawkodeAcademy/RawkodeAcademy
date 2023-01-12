import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { GcpControlPlane } from "./index";

interface ProjectArgs {
	controlPlane: GcpControlPlane;
}

export class RawkodeProject extends pulumi.ComponentResource {
	private readonly name: string;
	private readonly resourceOptions: pulumi.CustomResourceOptions;
	private readonly controlPlane: GcpControlPlane;
	private readonly serviceAccount: gcp.serviceaccount.Account;
	private key?: gcp.serviceaccount.Key;

	constructor(
		name: string,
		args: ProjectArgs,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super("rawkode:project", name, {}, opts);

		this.name = name;
		this.controlPlane = args.controlPlane;
		this.resourceOptions = {
			parent: this,
			deleteBeforeReplace: true,
		};

		this.serviceAccount = new gcp.serviceaccount.Account(
			name,
			{
				project: this.controlPlane.gcpProject,
				accountId: name,
				displayName: name,
			},
			this.resourceOptions,
		);
	}

	createKey(): this {
		this.key = new gcp.serviceaccount.Key(
			this.name,
			{
				serviceAccountId: this.serviceAccount.id,
			},
			this.resourceOptions,
		);

		return this;
	}

	enablePulumiSupport(): this {
		if (!this.controlPlane.isPulumiEnabled()) {
			throw new Error(
				"Pulumi support has not been enabled on the control plane.",
			);
		}

		// this.pulumiBinding = new gcp.projects.IAMBinding(
		// 	this.name,
		// 	{
		// 		project: this.controlPlane.gcpProject,
		// 		members: [
		// 			pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`,
		// 		],
		// 		role: this.controlPlane.getPulumiProjectRole().name,
		// 	},
		// 	this.resourceOptions,
		// );

		// this.pulumiCondtionalBinding = new gcp.projects.IAMBinding(
		// 	`${this.name}-conditional`,
		// 	{
		// 		project: this.controlPlane.gcpProject,
		// 		members: [
		// 			pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`,
		// 		],
		// 		role: this.controlPlane.getPulumiProjectConditionalRole().name,
		// 		condition: {
		// 			title: "own-resources",
		// 			description: "Only allow access to this projects own resources",
		// 			expression: `resource.matchTag('managedBy', 'pulumi/${this.name}')`,
		// 		},
		// 	},
		// 	this.resourceOptions,
		// );

		return this;
	}
}
