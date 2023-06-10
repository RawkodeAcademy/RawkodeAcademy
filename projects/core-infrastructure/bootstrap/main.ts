import {
  App,
  CloudBackend,
  NamedCloudWorkspace,
  TerraformOutput,
  TerraformStack,
} from "cdktf";
import { Construct } from "constructs";
import { AccessIdentityProvider } from "./.gen/providers/cloudflare/access-identity-provider";
import { AccessOrganization } from "./.gen/providers/cloudflare/access-organization";
import { ApiToken } from "./.gen/providers/cloudflare/api-token";
import { DataCloudflareApiTokenPermissionGroups } from "./.gen/providers/cloudflare/data-cloudflare-api-token-permission-groups";
import { CloudflareProvider } from "./.gen/providers/cloudflare/provider";
import { R2Bucket } from "./.gen/providers/cloudflare/r2-bucket";

const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
const githubClientId = process.env.GITHUB_CLIENT_ID!;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET!;

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new CloudflareProvider(this, "cloudflare");

    new AccessOrganization(this, "zero-trust-organization", {
      accountId: cloudflareAccountId,
      name: "Rawkode Cloud",
      authDomain: "rawkodeacademy.cloudflareaccess.com",
      isUiReadOnly: false,
      loginDesign: [
        {
          logoPath:
            "https://savvycal-uploads.s3.us-east-2.amazonaws.com/uploads/avatar/scope/35357/original.png?v=63824782292",
          backgroundColor: "#23282D",
          headerText: "#04B59C",
          textColor: "#ffffff",
          footerText: "#ffffff",
        },
      ],
    });

    new AccessIdentityProvider(this, "zero-trust-identity-provider", {
      accountId: cloudflareAccountId,
      name: "GitHub",
      type: "github",
      config: [
        {
          clientId: githubClientId,
          clientSecret: githubClientSecret,
        },
      ],
    });

    const cloudflarePermissions = new DataCloudflareApiTokenPermissionGroups(
      this,
      "cloudflare-permissions"
    );

    new R2Bucket(this, "terraform-state-bucket", {
      accountId: cloudflareAccountId,
      name: "rawkode-academy-terraform-state",
      location: "WEUR",
    });

    const apiToken = new ApiToken(this, "terraform-state-api-token", {
      name: "terraform-state-api-token",
      policy: [
        {
          permissionGroups: [
            cloudflarePermissions.account.lookup("Workers R2 Storage Write"),
          ],
          resources: {
            [`com.cloudflare.api.account.${cloudflareAccountId}`]: "*",
          },
        },
      ],
    });

    new TerraformOutput(this, "output-terraform-state-api-token", {
      value: apiToken.value,
      sensitive: true,
    });
  }
}

const app = new App();
const stack = new MyStack(app, "bootstrap");

new CloudBackend(stack, {
  hostname: "app.terraform.io",
  organization: "RawkodeAcademy",
  workspaces: new NamedCloudWorkspace("bootstrap"),
});

app.synth();
