import * as pulumi from "@pulumi/pulumi";
import * as scaleway from "@jaxxstorm/pulumi-scaleway";
import * as kubernetes from "@pulumi/kubernetes";
import { Cluster, ClusterArgs } from "./";

interface NodePoolArgs {
  size: number;
  nodeType: string;
  autoScaling: boolean;
  maxSize?: number;
}

export class ScalewayCluster extends Cluster {
  protected readonly name: string;
  protected readonly cluster: scaleway.KubernetesCluster;
  public readonly kubernetesProvider: kubernetes.Provider;
  public readonly kubeconfig: pulumi.Output<string>;
  protected nodePools: scaleway.KubernetesNodePool[] = [];

  constructor(name: string, args: ClusterArgs) {
    super(name, args);

    this.name = name;

    this.cluster = new scaleway.KubernetesCluster(
      this.name,
      {
        projectId: args.projectId,
        cni: "cilium",
        version: "1.23.6",
        type: "kapsule",
        deleteAdditionalResources: true,
      },
      {
        parent: this,
      }
    );

    this.kubeconfig = this.cluster.kubeconfigs[0].configFile;

    this.kubernetesProvider = new kubernetes.Provider(
      this.name,
      {
        kubeconfig: this.kubeconfig,
      },
      {
        parent: this.cluster,
      }
    );
  }

  public get clusterResource(): pulumi.Resource {
    return this.cluster;
  }

  public addNodePool(name: string, args: NodePoolArgs): this {
    this.nodePools.push(
      new scaleway.KubernetesNodePool(
        name,
        {
          ...args,
          clusterId: this.cluster.id,
          minSize: args.size,
          autohealing: true,
          autoscaling: true,
          containerRuntime: "containerd",
          upgradePolicy: {
            maxSurge: args.size,
            maxUnavailable: args.size,
          },
        },
        {
          parent: this.cluster,
        }
      )
    );

    return this;
  }
}
