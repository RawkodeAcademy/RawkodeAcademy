import * as pulumi from "@pulumi/pulumi";
import { GcpControlPlane } from "./control-plane";

const config = new pulumi.Config("gcp");

const controlPlane = new GcpControlPlane("control-plane", {
	gcpProject: config.require("project"),
});

controlPlane.enablePulumiIntegration();

const coreInfrastructureDns = controlPlane
	.createProject("core-infrastructure-dns")
	.createKey()
	.enablePulumiSupport();
