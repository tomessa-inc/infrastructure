import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { CfnOutput } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import {HostZoneCdkStack} from "./host-zone-cdk-stack";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import {IAMRoleStack} from "./iam-role-stack";
import {S3BucketStack} from "./s3-bucket-stack";

const hostZoneId = cdk.Fn.importValue('hostedZoneId')
const hostZoneName = cdk.Fn.importValue('hostedZoneName')

const domainName = `*.${hostZoneName}`;
const siteCertificationArn = cdk.Fn.importValue('siteCertificationArn')

let codeBuildRole:any;
export class CodeBuildCdkStack extends cdk.Stack {
    private _certificate:any;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.initialize();
    }

    initialize() {
    //    this.generateCertification();
      //  this.generateOutputs();
    }

    static getCodebuild(construct:Construct, name:string, domain:string) {
        let path: string = "";
        switch(name) {
            case "stage":
                path = "mamboleofc-frontend/BuildStageArtifact"
                break;
            case "production":
                path = "mamboleofc-frontend/BuildProductionArtifact"
                break;
            case "stage-api":
                path = "mamboleofc-api/BuildStageArtifact"
                break;
            case "production-api":
                path = "mamboleofc-api/BuildProductionArtifact"
                break;
            case "admin":
                path = "mamboleofc-admin/BuildArtifactAdmin"
                break;


        }
        console.log('the path')
        console.log(path);
        if (!codeBuildRole) {
            codeBuildRole = IAMRoleStack.getCodeBuildRole(construct,`${name}-codebuild`)
        }

        return new codebuild.Project(construct, `${name}-codebuild`, {
            role: codeBuildRole,
            projectName: `Container-${name}`,
            buildSpec: codebuild.BuildSpec.fromSourceFilename(`deployment/${name}.yml`),
            source: codebuild.Source.s3({
                bucket: S3BucketStack.getS3Bucket(construct, domain, "codebuild"),
                path: path
            }),

            //      codebuild.Source.gitHub({ owner: 'tomvisions', repo: 'https://github.com/B4TSolutions/test-docker-ecs' }),
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
            },

        });
    }
}