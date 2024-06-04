import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { RemovalPolicy } from 'aws-cdk-lib';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Duration } from 'aws-cdk-lib';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { SecretValue } from 'aws-cdk-lib';
import { CodeBuildAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import * as pipelineactions from "aws-cdk-lib/aws-codepipeline-actions";
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { IgnoreMode } from 'aws-cdk-lib';
import * as path from "path";
import * as fs from 'fs';
import { Code } from 'aws-cdk-lib/aws-codecommit';
import { CodeStarConnectionsSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import { aws_s3_deployment } from 'aws-cdk-lib';

declare const codePipeline: codepipeline.Pipeline;
const sourceArtifact = new codepipeline.Artifact('SourceArtifact');
const buildArtifactStage = new codepipeline.Artifact("BuildArtifactStage");
const buildArtifactProduction = new codepipeline.Artifact("BuildArtifactProduction");


export class tomvisionsAPICICDCdkStack extends cdk.Stack {
    declare myZone: route53.HostedZone;


    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);


        const sourceStage = {
            stageName: "Source",
            actions: [
                new CodeStarConnectionsSourceAction({
                    actionName: 'GitHub_Source',
                    owner: 'tomvisions',
                    repo: 'tomvisions-api',
                    connectionArn: 'arn:aws:codestar-connections:us-east-1:955552760689:connection/2ab40386-ec88-44e7-8e60-603bf85ddcd7',
                    output: sourceArtifact,
                    branch: 'main', // default: 'master',
                }),
            ],
        };

        const buildImageStage = new codebuild.Project(this, "TomvisionsMainBuildStage", {
            buildSpec: codebuild.BuildSpec.fromSourceFilename("deployment/stage.yml"),
            source: codebuild.Source.gitHub({ owner: 'tomvisions', repo: 'https://github.com/tomvisions/tomvisions-api' }),
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                environmentVariables: {
                },
            },
        });

        const buildImageProduction = new codebuild.Project(this, "TomvisionsMainBuildProduction", {
            buildSpec: codebuild.BuildSpec.fromSourceFilename("deployment/production.yml"),
            source: codebuild.Source.gitHub({ owner: 'tomvisions', repo: 'https://github.com/tomvisions/tomvisions-api' }),
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                environmentVariables: {
                },
            },
        });


        // Creates the build stage for CodePipeline
        const buildStage = {
            stageName: "Build-And-Stage",
            actions: [
                new pipelineactions.CodeBuildAction({
                    actionName: "CodeBuild",
                    input: sourceArtifact,
                    project: buildImageStage,
                    outputs: [buildArtifactStage],
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
                    project: buildImageProduction,
                    outputs: [buildArtifactProduction],
                }),
            ],

        };


        const Approval = {
            stageName: "Approval",
            actions: [
                new pipelineactions.ManualApprovalAction({
                    actionName: 'Approval',

                })]
        }

        const deployProduction = {
            stageName: "Deploy-to-Production",
            actions: [
                new pipelineactions.S3DeployAction({
                    actionName: 'S3Deploy',
                    bucket: s3.Bucket.fromBucketArn(this, 'tomvisionsbucketproduction', cdk.Fn.importValue('TomvisionsMainBucketProductionArn')),
                    input: buildArtifactProduction
                })]
        }



        const pipelineTomvisionsMain = new codepipeline.Pipeline(this, 'tomvisionsAPICICDCdkStack', {
            pipelineName: 'tomvisions-main',
            stages: [sourceStage, buildStage, Approval, buildProduction],
        });
    }
}

const app = new cdk.App();
new tomvisionsAPICICDCdkStack(app, 'tomvisionsAPICICDCdkStack')
app.synth();
