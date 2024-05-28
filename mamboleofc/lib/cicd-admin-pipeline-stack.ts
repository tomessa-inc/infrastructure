import * as cdk from "aws-cdk-lib";
import { aws_iam } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";

import * as pipelineactions from "aws-cdk-lib/aws-codepipeline-actions";
import { CodeStarConnectionsSourceAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { CodeBuildCdkStack } from "./code-build-stack";
import { IAMRoleStack } from "./iam-role-stack";
import * as s3 from "aws-cdk-lib/aws-s3";
import {S3BucketStack} from "./s3-bucket-stack";

declare const codePipeline: codepipeline.Pipeline;
const sourceArtifact = new codepipeline.Artifact("SourceArtifactAdmin");

const buildArtifactStage = new codepipeline.Artifact("buildArtifactStageAdmin");
const projectName = 'mamboleofc-members'

export class CicdAdminPipelineStack extends cdk.Stack {
    declare myZone: route53.HostedZone;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const sourceStage = {
            stageName: "Source",
            actions: [
                new CodeStarConnectionsSourceAction({
                    actionName: 'GitHub_Source',
                    owner: 'tomvisions',
                    repo: projectName,
                    connectionArn: 'arn:aws:codestar-connections:us-east-1:058264500305:connection/18fd2605-b71e-49e6-b5a1-391b70aae91a',
                    output: sourceArtifact,
                    branch: 'main', // default: 'master',
                }),
            ],
        };

        const buildStage = {
            stageName: "Build-Stage",
            actions: [
                new pipelineactions.CodeBuildAction({
                    actionName: "CodeBuild",
                    input: sourceArtifact,
                    project: CodeBuildCdkStack.getCodebuild(this, "admin", "admin.mamboleofc.ca"),
                    outputs: [buildArtifactStage],
                    combineBatchBuildArtifacts: true,
                    environmentVariables: {},
                }),
            ],
        };

        const deployStage = {
            stageName: "Deploy-to-Stage",
            actions: [
                new pipelineactions.S3DeployAction({
                    actionName: 'S3Deploy',
                    bucket: S3BucketStack.getS3Bucket(this, 'admin.mamboleofc.ca', "pipeline-admin"),
                    input: buildArtifactStage
                })]
        }


        const pipelineAPI = new codepipeline.Pipeline(this, "CICDCdkStack", {
            pipelineName: "mamboleofc-admin-pipeline",
            stages: [sourceStage,  buildStage, deployStage],
            artifactBucket: S3BucketStack.generateDynamicS3Bucket(this, "code-pipeline-admin-058264500305"),
            crossAccountKeys: false,
            role: IAMRoleStack.getCICDRole(this, "api-pipeline-role"),
            //pipelineType: PipelineType.V2,
            restartExecutionOnUpdate: true,
        });
    }
}
