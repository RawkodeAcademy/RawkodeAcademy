import {
  App,
  CloudBackend,
  NamedCloudWorkspace,
  TerraformOutput,
  TerraformStack,
} from "cdktf";
import { Construct } from "constructs";
import { ApiToken } from "./.gen/providers/cloudflare/api-token";
import { DataCloudflareApiTokenPermissionGroups } from "./.gen/providers/cloudflare/data-cloudflare-api-token-permission-groups";
import { CloudflareProvider } from "./.gen/providers/cloudflare/provider";
import { R2Bucket } from "./.gen/providers/cloudflare/r2-bucket";

const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID!;

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new CloudflareProvider(this, "cloudflare");

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
const stack = new MyStack(app, "terraform-bootstrap");

new CloudBackend(stack, {
  hostname: "app.terraform.io",
  organization: "RawkodeAcademy",
  workspaces: new NamedCloudWorkspace("terraform-bootstrap"),
});

app.synth();
