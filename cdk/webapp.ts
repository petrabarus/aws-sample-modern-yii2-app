import cdk = require('@aws-cdk/core');
import ecs = require("@aws-cdk/aws-ecs");
import ecsPatterns = require("@aws-cdk/aws-ecs-patterns");
import ecr = require('@aws-cdk/aws-ecr');
import dynamodb = require('@aws-cdk/aws-dynamodb')
import { Cluster } from './cluster';

interface WebAppProps {
    readonly cluster: Cluster;
}

class WebApp extends cdk.Construct {
    private fargateService: ecsPatterns.ApplicationLoadBalancedFargateService;
    private sessionTable: dynamodb.Table;

    public readonly service: ecs.IBaseService;
    public readonly containerName: string;
    public readonly ecrRepo: ecr.Repository;

    constructor(scope: cdk.Construct, id: string, props: WebAppProps) {
        super(scope, id);
        this.ecrRepo = new ecr.Repository(this, 'ECRRepo');        
        this.sessionTable = this.createSessionTable();
        
        this.fargateService = this.createService(props.cluster.ecsCluster);
        this.service = this.fargateService.service;
        this.containerName = this.fargateService.taskDefinition.defaultContainer!.containerName;
        
        this.grantPermissions();
        this.addAutoScaling();
        this.output();
    }

    private createService(cluster: ecs.Cluster) {
        const region = cdk.Stack.of(this).region;
        return new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Service', {
            cluster: cluster,
            taskImageOptions: {
                image: ecs.ContainerImage.fromAsset('.'),
                environment: {
                    AWS_REGION: region,
                    DYNAMODB_SESSION_TABLE_NAME: this.sessionTable.tableName,
                }
            },
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

    private createSessionTable(): dynamodb.Table {
        return new dynamodb.Table(this, 'Sessions', {
            partitionKey: {
                name: 'id',
                type: dynamodb.AttributeType.STRING,
            }
        });
    }

    private grantPermissions() {
        const taskDefinition = this.fargateService.taskDefinition;
        this.ecrRepo.grantPull(taskDefinition.executionRole!);

        const actions = [
            "dynamodb:GetItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem",
            "dynamodb:Scan",
            "dynamodb:BatchWriteItem"
        ]
        this.sessionTable.grant(taskDefinition.taskRole, ...actions);
    }

    private output() {
        new cdk.CfnOutput(this, 'ECRRepoURI', {value: this.ecrRepo.repositoryUri});
        new cdk.CfnOutput(this, 'ServiceName', {value: this.service.serviceName});
        new cdk.CfnOutput(this, 'ContainerName', {value: this.containerName});
        new cdk.CfnOutput(this, 'SessionTableName', {value: this.sessionTable.tableName});
    }

}

export {WebApp, WebAppProps};