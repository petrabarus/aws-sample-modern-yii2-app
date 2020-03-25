import cdk = require('@aws-cdk/core');
import codebuild = require('@aws-cdk/aws-codebuild');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codepipeline_actions = require('@aws-cdk/aws-codepipeline-actions');
import ssm = require("@aws-cdk/aws-ssm");
import ecr = require('@aws-cdk/aws-ecr');
import ecs = require('@aws-cdk/aws-ecs');
import { WebApp } from './webapp';

interface PipelineProps {
    readonly webapp: WebApp;
}

class Pipeline extends cdk.Construct {
    private readonly webapp: WebApp;

    readonly service: ecs.IBaseService;
    readonly containerName: string;
    readonly ecrRepo: ecr.Repository;

    public readonly pipeline: codepipeline.Pipeline;

    constructor(scope: cdk.Construct, id: string, props: PipelineProps) {
        super(scope, id);
        this.webapp = props.webapp;
        this.service = this.webapp.service;
        this.ecrRepo = this.webapp.ecrRepo;
        this.containerName = this.webapp.containerName;

        this.pipeline = this.createPipeline();
        this.output();
    }

    private createPipeline(): codepipeline.Pipeline {
        const sourceOutput = new codepipeline.Artifact();
        const buildOutput = new codepipeline.Artifact();
        return new codepipeline.Pipeline(this, 'Pipeline', {
            stages: [
                this.createSourceStage('Source', sourceOutput),
                this.createImageBuildStage('Build', sourceOutput, buildOutput),
                this.createDeployStage('Deploy', buildOutput),
            ]
        });
    }

    private createSourceStage(stageName: string, output: codepipeline.Artifact): codepipeline.StageProps {
        const secret = cdk.SecretValue.secretsManager('/app1/prod/GITHUB_OAUTH_TOKEN');
        const repo = ssm.StringParameter.valueForStringParameter(this, '/app1/prod/GITHUB_REPO');
        const owner = ssm.StringParameter.valueForStringParameter(this, '/app1/prod/GITHUB_OWNER');
        const githubAction = new codepipeline_actions.GitHubSourceAction({
            actionName: 'Github_Source',
            owner: owner,
            repo: repo,
            oauthToken: secret,
            output: output,
        });
        return {
            stageName: stageName,
            actions: [githubAction],
        };
    }

    private createImageBuildStage(
        stageName: string,
        input: codepipeline.Artifact,
        output: codepipeline.Artifact
    ): codepipeline.StageProps {
        const props = {
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
                privileged: true,
            },
            environmentVariables: {
                REPOSITORY_URI: {value: this.ecrRepo.repositoryUri},
                CONTAINER_NAME: {value: this.containerName}
            }
        };
        const project = new codebuild.PipelineProject(this, 'Project', props);
        this.ecrRepo.grantPullPush(project.grantPrincipal);
        
        const codebuildAction = new codepipeline_actions.CodeBuildAction({
            actionName: 'CodeBuild_Action',
            input: input,
            outputs: [output],
            project: project,
        });

        return {
            stageName: stageName,
            actions: [codebuildAction],
        };
    }

    createDeployStage(stageName: string, input: codepipeline.Artifact): codepipeline.StageProps {
        const ecsDeployAction = new codepipeline_actions.EcsDeployAction({
            actionName: 'ECSDeploy_Action',
            input: input,
            service: this.service,
        });
        return {
            stageName: stageName,
            actions: [ecsDeployAction],
        }
    }

    output() {
        new cdk.CfnOutput(this, 'Pipeline ARN', {value: this.pipeline.pipelineArn})
    }
}

export {Pipeline, PipelineProps};
