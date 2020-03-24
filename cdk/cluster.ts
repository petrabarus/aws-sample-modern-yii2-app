import cdk = require('@aws-cdk/core');
import ecs = require("@aws-cdk/aws-ecs");
import { CfnOutput } from '@aws-cdk/core';

class Cluster extends cdk.Construct {
    readonly ecsCluster: ecs.Cluster;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        this.ecsCluster = new ecs.Cluster(this, 'EcsCluster');
        this.output();
    }

    output() {
        new CfnOutput(this, 'ECSCluster_ARN', {value: this.ecsCluster.clusterArn});
    }
}

export {Cluster};
