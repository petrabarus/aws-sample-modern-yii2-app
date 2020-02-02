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
        autoScalingGroup.scaleOnSchedule('ScaleUpInMorning', {
            schedule: appAutoscaling.Schedule.cron({hour: '07', minute: '30'}),
            minCapacity: 10,
        });
        autoScalingGroup.scaleOnSchedule('ScaleDownInEvening', {
            schedule: appAutoscaling.Schedule.cron({hour: '12', minute: '00'}),
            maxCapacity: 5,
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
