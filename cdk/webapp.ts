import cdk = require('@aws-cdk/core');
import ecs = require("@aws-cdk/aws-ecs");
import ecsPatterns = require("@aws-cdk/aws-ecs-patterns");
import ecr = require('@aws-cdk/aws-ecr');
import { CfnOutput } from '@aws-cdk/core';
import { Cluster } from './cluster';

interface WebAppProps {
    readonly cluster: Cluster;
}

class WebApp extends cdk.Construct {
    private fargateService: ecsPatterns.ApplicationLoadBalancedFargateService;

    public readonly service: ecs.IBaseService;
    public readonly containerName: string;
    public readonly ecrRepo: ecr.Repository;

    constructor(scope: cdk.Construct, id: string, props: WebAppProps) {
        super(scope, id);
        this.fargateService = this.createService(props.cluster.ecsCluster);

        this.ecrRepo = new ecr.Repository(this, 'ECRRepo');
        this.ecrRepo.grantPull(this.fargateService.taskDefinition.executionRole!);
        this.service = this.fargateService.service;
        this.containerName = this.fargateService.taskDefinition.defaultContainer!.containerName;
    
        this.addAutoScaling();
        this.output();
    }

    private createService(cluster: ecs.Cluster) {
        return new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Service', {
            cluster: cluster,
            taskImageOptions: {
                image: ecs.ContainerImage.fromAsset('.'),
            }
        });
    }

    private addAutoScaling() {
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

    private output() {
        new CfnOutput(this, 'ECRRepoURI', {value: this.ecrRepo.repositoryUri});
        new CfnOutput(this, 'ServiceName', {value: this.service.serviceName});
        new CfnOutput(this, 'ContainerName', {value: this.containerName});
    }
}

export {WebApp, WebAppProps};