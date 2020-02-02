#!/usr/bin/env node
/*********************************
 * AWS CDK script to provision the resources.
 */

import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import ecs = require("@aws-cdk/aws-ecs");
import ecsPatterns = require("@aws-cdk/aws-ecs-patterns");
import appAutoscaling = require("@aws-cdk/aws-applicationautoscaling");

class WebECSCluster extends cdk.Construct {
    private fargateService: ecsPatterns.ApplicationLoadBalancedFargateService;

    constructor(scope: cdk.Construct) {
        super(scope, "WebECSCluster");

        const ecsCluster = new ecs.Cluster(this, 'ecsCluster');
        this.fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Service', {
            cluster: ecsCluster,
            taskImageOptions: {
                image: ecs.ContainerImage.fromAsset('.')
            },
        });

        this.addAutoScaling();
    }

    addAutoScaling() {
        const autoScalingGroup = this.fargateService.service.autoScaleTaskCount({
            minCapacity: 2,
            maxCapacity: 10
        });
        autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
            targetUtilizationPercent: 50,
            scaleInCooldown: cdk.Duration.seconds(60),
            scaleOutCooldown: cdk.Duration.seconds(60),
        });
    }
}

class WebStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        new WebECSCluster(this);
    }
}

const app = new cdk.App();
new WebStack(app, 'WebStack');

app.synth();
