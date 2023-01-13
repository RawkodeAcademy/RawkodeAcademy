import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { GcpControlPlane } from "..";

export class PulumiIntegration extends pulumi.ComponentResource {
	public readonly secretsManagerCreateRole: gcp.projects.IAMCustomRole;
	public readonly secretsManagerAccessRole: gcp.projects.IAMCustomRole;

	constructor(gcpControlPlane: GcpControlPlane) {
		super(
			"rawkode:ControlPlane:PulumiIntegration",
			"pulumi",
			{},
			{
				parent: gcpControlPlane,
			},
		);

		this.secretsManagerCreateRole = new gcp.projects.IAMCustomRole(
			"pulumi-secrets-manager-create",
			{
				title: "Pulumi Role for Creating Secrets",
				roleId: "pulumi-secrets-manager-create".replace(/-/g, "."),
				description:
					"Pulumi Secrets Manager Create Role for Rawkode Academy Projects",
				project: gcpControlPlane.gcpProject,
				permissions: ["secretmanager.secrets.create"],
			},
			{
				parent: this,
				deleteBeforeReplace: true,
			},
		);

		this.secretsManagerAccessRole = new gcp.projects.IAMCustomRole(
			"pulumi-secrets-manager-access",
			{
				title: "Pulumi Role for Accessing Secrets",
				roleId: "pulumi-secrets-manager-access".replace(/-/g, "."),
				description:
					"Pulumi Secrets Manager Access Role for Rawkode Academy Projects",
				project: gcpControlPlane.gcpProject,
				permissions: [
					"secretmanager.secrets.get",
					"secretmanager.versions.access",
				],
			},
			{
				parent: this,
				deleteBeforeReplace: true,
			},
		);
	}
}
