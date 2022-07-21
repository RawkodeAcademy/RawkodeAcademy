import * as pulumi from "@pulumi/pulumi";
import * as mongodbatlas from "@pulumi/mongodbatlas";
import * as kubernetes from "@pulumi/kubernetes";
import * as random from "@pulumi/random";

const projectId = "5febb37aed71e746372e66e4";

const cluster = new mongodbatlas.ServerlessInstance("cluster", {
  name: "rawkode-academy-payloadcms",
  projectId,
  providerSettingsBackingProviderName: "GCP",
  providerSettingsProviderName: "SERVERLESS",
  providerSettingsRegionName: "WESTERN_EUROPE",
  stateName: "IDLE",
});

export const connectionString = cluster.connectionStringsStandardSrv;

cluster.connectionStringsStandardSrv.apply((a) => console.log(`ABC: ${a}`));

const cmsPassword = new random.RandomPassword("cms", {
  length: 32,
});

const cmsUser = new mongodbatlas.DatabaseUser("cms", {
  authDatabaseName: "admin",
  projectId,
  roles: [
    {
      databaseName: "admin",
      roleName: "atlasAdmin",
    },
  ],
  username: "rawkodeacademy",
  password: cmsPassword.result,
});

const mongodbSecret = new kubernetes.core.v1.Secret("mongodb", {
  metadata: {
    name: "cms-mongodb",
  },
  data: {
    connectionString: pulumi
      .all([
        cmsUser.username,
        cmsUser.password,
        cluster.connectionStringsStandardSrv,
      ])
      .apply(([username, password, connectionString]) =>
        connectionString.replace(
          "mongodb+srv://",
          `mongodb+srv://${username}:${password}`
        )
      ),
  },
});
