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
const sourceArtifact = new codepipeline.Artifact("SourceArtifact");

const buildArtifactStage = new codepipeline.Artifact("buildArtifactStage");
const buildArtifactProduction = new codepipeline.Artifact("buildArtifactProduction");
const projectName = 'kofc9544-api'

export class CicdApiPipelineStack extends cdk.Stack {
    declare myZone: route53.HostedZone;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const sourceStage = {
            stageName: "Source",
            actions: [
                new CodeStarConnectionsSourceAction({
                    actionName: 'GitHub_Source',
                    owner: 'tomessa-inc',
                    repo: projectName,
                    connectionArn: 'arn:aws:codestar-connections:us-east-1:767397839074:connection/3f4d5fbd-ac3a-4e58-b1e8-b85fe3a86419',
                    output: sourceArtifact,
                    branch: 'main', // default: 'master',
                }),
            ],
        };

        const Approval = {
            stageName: "Approval",
            actions: [
                new pipelineactions.ManualApprovalAction({
                    actionName: "Approval",
                }),
            ],
        };

        const buildStage = {
            stageName: "Build-Stage",
            actions: [
                new pipelineactions.CodeBuildAction({
                    actionName: "CodeBuild",
                    input: sourceArtifact,
                    project: CodeBuildCdkStack.getCodebuild(this, "stage-api", "kofc9544-api-stage"),
                    outputs: [buildArtifactStage],
                    combineBatchBuildArtifacts: true,
                    environmentVariables: {},
                }),
            ],
        };


        // Creates the build stage for CodePipeline
        const buildProduction = {
            stageName: "Build-Production",
            actions: [
                new pipelineactions.CodeBuildAction({
                    actionName: "CodeBuild",
                    input: sourceArtifact,
                    project: CodeBuildCdkStack.getCodebuild(this, "production-api", "kofc9544-api-production"),
                    outputs: [buildArtifactProduction],
                    environmentVariables: {},
                }),
            ],
        };

        const pipelineAPI = new codepipeline.Pipeline(this, "CICDAPICdkStack", {
            pipelineName: "api-pipeline",
            stages: [sourceStage,  buildStage,  Approval, buildProduction],
            artifactBucket: S3BucketStack.generateDynamicS3Bucket(this, "code-pipeline-api-767397839074"),
            crossAccountKeys: false,
            role: IAMRoleStack.getCICDRole(this, "api-pipeline-role"),
            //pipelineType: PipelineType.V2,
            restartExecutionOnUpdate: true,
        });
    }
}
