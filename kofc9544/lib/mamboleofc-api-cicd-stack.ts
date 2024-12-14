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
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';


declare const codePipeline: codepipeline.Pipeline;

const sourceArtifact = new codepipeline.Artifact('SourceArtifact');
const buildArtifactStage = new codepipeline.Artifact("BuildArtifactStage");
const buildArtifactProduction = new codepipeline.Artifact("BuildArtifactProduction");
//const pipelineBucket  = 'codepipeline-us-east-1-992382682688-projects';
const stageAPIBucket = "mamboleofc-api-stage"; 
const prodAPIBucket = "mamboleofc-api-production"; 


export class APICICDCdkStack extends cdk.Stack {
    declare myZone: route53.HostedZone;


    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

       // const codeBuildRole = iam.Role.fromRoleArn(this, 'tomvisionsAPICodeBuildRole', dsp-cdk.Fn.importValue('TomvisionsCodeBuildRoleArn'));
      

       const stagingAPIBucket = new s3.Bucket(this, 'StageAPIBucket', {
        bucketName: stageAPIBucket,
        publicReadAccess: false,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            /**
         * The default removal policy is RETAIN, which means that dsp-cdk destroy will not attempt to delete
         * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
         * DESTROY, dsp-cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
         */
            removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
  
            /**
             * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
             * setting will enable full cleanup of the demo.
             */
            autoDeleteObjects: true, // NOT recommended for production code
          });
  
          const productionAPIBucket = new s3.Bucket(this, 'ProdAPIBucket', {
            bucketName: prodAPIBucket,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
                /**
             * The default removal policy is RETAIN, which means that dsp-cdk destroy will not attempt to delete
             * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
             * DESTROY, dsp-cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
             */
                removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
      
                /**
                 * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
                 * setting will enable full cleanup of the demo.
                 */
                autoDeleteObjects: true, // NOT recommended for production code
              });

        const codeBuildRole = new iam.Role(this, 'Role', {
            assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
            description: 'IAM Role for builds',
            roleName: 'role-node-codebuild-pipeline'
          });
      

        const policy = iam.Policy.fromPolicyName(this, 'testingPolicy','AmazonS3FullAccess');


    

        const sourceStage = {
            stageName: "Source",
            actions: [
                new CodeStarConnectionsSourceAction({
                    actionName: 'GitHub_Source',
                    owner: 'tomvisions',
                    repo: 'mamboleofc-api',
                    connectionArn: 'arn:aws:codestar-connections:us-east-1:058264500305:connection/18fd2605-b71e-49e6-b5a1-391b70aae91a',
                    output: sourceArtifact,
                    branch: 'main', // default: 'master',
                }),
            ],
        };

//        const codeBuildRole = iam.Role.fromRoleArn(this, 'tomvisionsAPICodeBuildRole', dsp-cdk.Fn.importValue('TomvisionsCodeBuildRoleArn'));
      
      //  const policy = iam.Policy.fromPolicyName(this, 'testingPolicy','AmazonS3FullAccess');
  //      console.log('policy');
    //    console.log(policy);
//        codeBuildRole.addManagedPolicy(policy.);
//          codeBuildRole.addManagedPolicy(policy);


        const buildImageStage = new codebuild.Project(this, "APIBuildStage", {
            buildSpec: codebuild.BuildSpec.fromSourceFilename("deployment/stage.yml"),
            source: codebuild.Source.gitHub({ owner: 'tomvisions', repo: 'https://github.com/tomvisions/mamboleofc-api' }),
            role: codeBuildRole,
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                environmentVariables: {
                    DB_INFO: {
                        value: secretsmanager.Secret.fromSecretNameV2(this, 'DB_INFO_STAGE_BUILD', 'DB_INFO_STAGE').secretName,
                        type: codebuild.BuildEnvironmentVariableType.SECRETS_MANAGER
                    },
                },
            },
        });

        const buildImageProduction = new codebuild.Project(this, "APIBuildProduction", {
            buildSpec: codebuild.BuildSpec.fromSourceFilename("deployment/production.yml"),
            source: codebuild.Source.gitHub({ owner: 'tomvisions', repo: 'https://github.com/tomvisions/mamboleofc-api' }),
            role: codeBuildRole,
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                environmentVariables: {
                    DB_INFO: {
                        value: secretsmanager.Secret.fromSecretNameV2(this, 'DB_INFO_PRODUCTION_BUILD', 'DB_INFO_PRODUCTION').secretName,
                        type: codebuild.BuildEnvironmentVariableType.SECRETS_MANAGER
                    },
                },
            },
        });

        // Creates the build stage for CodePipeline
        const buildStage = {
            stageName: "Build-Stage",
            actions: [
                new pipelineactions.CodeBuildAction({
                    actionName: "CodeBuild",
                    input: sourceArtifact,
                    project: buildImageStage,
                    outputs: [buildArtifactStage],
                    environmentVariables: {
                        DB_INFO: {
                            value: secretsmanager.Secret.fromSecretNameV2(this, 'DB_INFO_STAGE', 'DB_INFO').secretName,
                            type: codebuild.BuildEnvironmentVariableType.SECRETS_MANAGER
                        },
                        MONGO_DB_INFO: {
                            value: secretsmanager.Secret.fromSecretNameV2(this, 'MONGO_DB_INFO_STAGE', 'MONGO_DB_INFO').secretName,
                            type: codebuild.BuildEnvironmentVariableType.SECRETS_MANAGER
                        },
                        STAGE: {
                            value: "stage",
                            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT
                        },
                    },
                    variablesNamespace: 'BuildVariables',
                }),
            ],
            variablesNamespace: 'BuildVariables',
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
                    environmentVariables: {
                        DB_INFO: {
                            value: secretsmanager.Secret.fromSecretNameV2(this, 'DB_INFO_PROD', 'DB_INFO').secretName,
                            type: codebuild.BuildEnvironmentVariableType.SECRETS_MANAGER
                        },
                        MONGO_DB_INFO: {
                            value: secretsmanager.Secret.fromSecretNameV2(this, 'MONGO_DB_INFO_PROD', 'MONGO_DB_INFO').secretName,
                            type: codebuild.BuildEnvironmentVariableType.SECRETS_MANAGER
                        },
                        STAGE: {
                            value: "production",
                            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT
                        },
                    },

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

        const pipelineGallery = new codepipeline.Pipeline(this, 'APICICDCdkStack', {
            pipelineName: 'mamboleofc-api',
            stages: [sourceStage, buildStage, Approval, buildProduction],
            artifactBucket: s3.Bucket.fromBucketArn(this, 'APIBucketPipeline',cdk.Fn.importValue('BucketPipelineArn')),   
                     
        });

    }
}

const app = new cdk.App();
new APICICDCdkStack(app, 'APICICDCdkStack', {
    stackName: "TomvisonsAPICICD",

})
app.synth();
