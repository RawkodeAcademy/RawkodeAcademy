import { ScalewayCluster } from "./cluster";

const projectId: string = process.env.SCW_PROJECT_ID!;

const cluster = new ScalewayCluster("cluster", {
  name: "rawkode-academy",
  projectId,
})
  .addNodePool("essential", {
    nodeType: "GP1-XS",
    size: 1,
    autoScaling: false,
  })
  .addNodePool("ephemeral", {
    nodeType: "DEV1-M",
    size: 1,
    maxSize: 5,
    autoScaling: true,
  });

export const kubeconfig = cluster.kubeconfig;
