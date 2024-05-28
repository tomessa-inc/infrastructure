import {Stack, StackProps, CfnOutput, aws_iam} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdk from "aws-cdk-lib";
import {Effect, PolicyStatement, ManagedPolicy, Policy} from "aws-cdk-lib/aws-iam";

const codeBuildRoleArn  = cdk.Fn.importValue('codeBuildRoleArn')
const cicdRoleArn  = cdk.Fn.importValue('cicdRoleArn')
const codeDeployRoleArn  = cdk.Fn.importValue('codeDeployRoleArn')
const taskDefinitionRoleArn  = cdk.Fn.importValue('taskDefinitionRoleArn')
const taskExecutionRoleArn  = cdk.Fn.importValue('taskExecutionRoleArn')

let codeBuildRole:aws_iam.Role;
let cicdRole:aws_iam.Role;
let codeDeployRole: aws_iam.Role;
let taskDefinitionRole: aws_iam.Role;
let taskExecutionRole: aws_iam.Role;


export class IAMRoleStack extends Stack {


    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.initialize();
    }

    static getCICDRole(construct: Construct, name:string) {
        const assumedBy = 'codepipeline.amazonaws.com';
        const prefix = `${name}-CICDRole`
       // this.generateIAMRole(construct, prefix, assumedBy);


        const role = aws_iam.Role.fromRoleArn(construct, `${name}-ecsCodePipelineRole`, cicdRoleArn, {
            mutable: false,
            defaultPolicyName: "AdministratorAccess"
        })

        const policy =   new Policy(construct, 'the-policy-cicdpipeline', {
            policyName: "CICDPolicy",
            //  roles: [cicdRole],
            statements: [
                new PolicyStatement({

                    effect: Effect.ALLOW,
                    resources: ['*'],
                    actions: [
                        "*",
                        "s3:Abort*",
                        "s3:DeleteObject*",
                        "s3:GetBucket*",
                        "s3:GetObject*",
                        "s3:List*",
                        "s3:PutObject",
                        "s3:PutObjectLegalHold",
                        "s3:PutObjectRetention",
                        "s3:PutObjectTagging",
                        "s3:PutObjectVersionTagging",
                        "codedeploy:GetApplication",
                        "ecs:*",
                        "ecr:*",
                        "iam:*",
                        //         "*"
                    ],
                })],


        });

        role.attachInlinePolicy(policy);
        role.addManagedPolicy({managedPolicyArn: "arn:aws:iam::aws:policy/AdministratorAccess"})

        return role;
    }


    static getCodeBuildRole(construct: Construct, name:string) {
        return aws_iam.Role.fromRoleArn(construct, `${name}-ecsCodeBuildRoleRol`, codeBuildRoleArn, {
            mutable:false,
        })
    }


    static generateIAMRole(construct:Construct, id:string, assumedBy:string) {
        new aws_iam.Role(construct, `${id}-role`, {
            roleName: "codeBuild-role",
            assumedBy: new aws_iam.ServicePrincipal(assumedBy),
        });
    }


    generateECSTaskExecutionRole() {
        taskExecutionRole = new aws_iam.Role(this, 'ecsTaskExecutionRoleGenerate', {
            roleName: "ecsTaskExecution-role",
            assumedBy: new aws_iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        });
    }

    generateECSTaskExecutionPolicy() {
        taskExecutionRole.addManagedPolicy({managedPolicyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"})
        taskExecutionRole.addManagedPolicy({managedPolicyArn: "arn:aws:iam::aws:policy/CloudWatchFullAccess"})
        taskExecutionRole.addManagedPolicy({managedPolicyArn: "arn:aws:iam::aws:policy/AdministratorAccess"})
        taskExecutionRole.addToPolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                resources: ['*'],
                actions: [
                    "kms:Decrypt",
                    "secretsmanager:GetSecretValue",
                    "ssm:GetParameters",
                ]
            })
        );
    }

    generateECSTaskDefinitionRole() {
        taskDefinitionRole = new aws_iam.Role(this, 'ecsTaskDefinitionRoleGenerate', {
            roleName: "ecsTaskDefinition-role",
            assumedBy: new aws_iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        });
    }

    generateECSTaskDefinitionPolicy() {
        // Add a policy to a Role

        taskDefinitionRole.addManagedPolicy({managedPolicyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"})
        taskDefinitionRole.addManagedPolicy({managedPolicyArn: "arn:aws:iam::aws:policy/CloudWatchFullAccess"})
        taskDefinitionRole.addManagedPolicy({managedPolicyArn: "arn:aws:iam::aws:policy/AdministratorAccess"})
        taskDefinitionRole.addToPolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                resources: ['*'],
                actions: [
                    "kms:Decrypt",
                    "secretsmanager:GetSecretValue",
                    "ssm:GetParameters",
                ]
            })
        );
        /*   this._taskDefinitionRole.addToPolicy(
               new PolicyStatement({
                   effect: Effect.ALLOW,
                   resources: ['*'],
                   actions: [
                       "*"
                   ]
               })
           ); */

    }

    generateCodeBuildRole() {
        codeBuildRole = new aws_iam.Role(this, 'CodeBuildRole', {
            roleName: "codeBuild-role",
            assumedBy: new aws_iam.ServicePrincipal('codebuild.amazonaws.com'),
        });

    }

    generateCodeDeployRole() {
        codeDeployRole = new aws_iam.Role(this, 'codeDeployRole', {
            roleName: "ecsCodeDeploy-role",
            assumedBy: new aws_iam.ServicePrincipal('codedeploy.amazonaws.com'),
        });
    }

    generateCodeDeployPolicy() {
        codeDeployRole.addManagedPolicy({managedPolicyArn: "arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS"})
        codeDeployRole.addManagedPolicy({managedPolicyArn: "arn:aws:iam::aws:policy/AdministratorAccess"})

        // Add a policy to a Role
        codeDeployRole.addToPolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                resources: ['*'],
                actions: [
                    'ecs:DescribeServices',
                    'ecs:TagResource',
                ]
            })
        );
    }
    generateCICDRole() {
        cicdRole = new aws_iam.Role(this, 'CICDRole', {
            roleName: "codepipeline-role",
            assumedBy: new aws_iam.ServicePrincipal('codepipeline.amazonaws.com'),
        });
    }

    generateCICDPolicy() {
        // Add a policy to a Role

        const policy =   new Policy(this, 'the-policy-cicdpipeline', {
            policyName: "CICDPolicy",
          //  roles: [cicdRole],
            statements: [
                new PolicyStatement({

                    effect: Effect.ALLOW,
                    resources: ['*'],
                    actions: [
//                        "*",
                        "s3:Abort*",
                        "s3:DeleteObject*",
                        "s3:GetBucket*",
                        "s3:GetObject*",
                        "s3:List*",
                        "s3:PutObject",
                        "s3:PutObjectLegalHold",
                        "s3:PutObjectRetention",
                        "s3:PutObjectTagging",
                        "s3:PutObjectVersionTagging",
                        "codedeploy:GetApplication",
                        "ecs:*",
                        "ecr:*",
                        "iam:*",
               //         "*"
                    ],
                })],


        });

        cicdRole.attachInlinePolicy(policy);
        cicdRole.addManagedPolicy({managedPolicyArn: "arn:aws:iam::aws:policy/AdministratorAccess"})

        /*        cicdRole.addToPolicy(
                    new PolicyStatement({

                        effect: Effect.ALLOW,
                        resources: ['*'],
                        actions: [
                            "*",
                            "s3:Abort*",
                            "s3:DeleteObject*",
                            "s3:GetBucket*",
                            "s3:GetObject*",
                            "s3:List*",
                            "s3:PutObject",
                            "s3:PutObjectLegalHold",
                            "s3:PutObjectRetention",
                            "s3:PutObjectTagging",
                            "s3:PutObjectVersionTagging",
                            "codedeploy:GetApplication",
                            "ecs:*",
                            "iam:*",
                            "*"
                        ],
                    })
                ); */
    }

    generateCodeBuildPolicy() {
        // Add a policy to a Role
        codeBuildRole.addToPolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                resources: ['*'],
                actions: [
                    "ecr:BatchGetImage",
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:CompleteLayerUpload",
                    "ecr:DescribeImages",
                    "ecr:DescribeRepositories",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:InitiateLayerUpload",
                    "ecr:ListImages",
                    "ecr:PutImage",
                    "ecr:UploadLayerPart",
                    'ecr:GetAuthorizationToken',
                    'ecr:InitiateLayerUpload',
                    'ecr:UploadLayerPart',
                    'ecr:CompleteLayerUpload',
                    's3:*',
                    'logs:CreateLogStream'
                ]
            })
        );
        codeBuildRole.addManagedPolicy({managedPolicyArn: "arn:aws:iam::aws:policy/AdministratorAccess"})
    }
    generateAmazonECSTaskExecutionRolePolicy() {
        //   return ManagedPolicy.fromManagedPolicyName(this, 'AmazonECSTaskExecutionRolePolicy', 'AmazonECSTaskExecutionRolePolicy');
    }

    generateOutputs() {
        new CfnOutput(this, 'cicdRoleArn', { value: cicdRole.roleArn, exportName: "cicdRoleArn" })
        new CfnOutput(this, 'codeBuildRoleArn', { value: codeBuildRole.roleArn, exportName: "codeBuildRoleArn" })
        new CfnOutput(this, 'codeDeployRoleArn', { value: codeDeployRole.roleArn, exportName: "codeDeployRoleArn" })
    }
    initialize() {
        this.generateCodeBuildRole();
        this.generateCodeBuildPolicy();
        this.generateCICDRole();
        this.generateCICDPolicy();
        this.generateCodeDeployRole();
        this.generateCodeBuildPolicy();


        this.generateOutputs();
    }
}