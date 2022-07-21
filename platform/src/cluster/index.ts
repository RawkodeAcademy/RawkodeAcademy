import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

export abstract class Cluster extends pulumi.ComponentResource {
  protected abstract readonly cluster: pulumi.Resource;
  public abstract get clusterResource(): pulumi.Resource;
  public abstract get kubernetesProvider(): kubernetes.Provider;

  constructor(name: string, args: ClusterArgs) {
    super("rawkode:platform:Cluster", name, args);
  }
}

export interface ClusterProvider {
  (args: ClusterArgs): kubernetes.Provider;
}

export interface ClusterArgs {
  name: string;
  projectId: string;
}

export interface NodePool {
  instanceType: string;
  numberOfNodes: number;
}

export * from "./scaleway";
