import {Stack, StackProps, aws_elasticloadbalancingv2, CfnOutput, Tags, RemovalPolicy, CfnParameter} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";

const mediaBucketArn  = cdk.Fn.importValue('bucketOutput-media-scheduler-page-Arn')
const stageBucketArn  = cdk.Fn.importValue('bucketOutput-stage-scheduler-page-Arn')
const wwwBucketArn  = cdk.Fn.importValue('bucketOutput-www-scheduler-page-Arn')

let bucketPipeline:cdk.aws_s3.Bucket;
let  bucketName:any
export class S3BucketStack extends Stack {
    private _s3Bucket: cdk.aws_s3.Bucket
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.initialize();
    }

        static getS3Bucket(construct: Construct, domainName: string, identifier:string) {
        let arn;
            switch(domainName) {
                case "media.scheduler.page":
                    arn = mediaBucketArn
                    break;
                case "stage.scheduler.page":
                    arn = stageBucketArn
                    break;
                default:
                    arn = wwwBucketArn
                    break;

            }
            return cdk.aws_s3.Bucket.fromBucketArn(construct, `${domainName}-s3-bucket-domain-${identifier}`, arn)
        }


    generateOutputs(bucketName:string) {

        new CfnOutput(this, `bucketOutput-${bucketName}-Arn`, { value: this._s3Bucket.bucketArn, exportName: `bucketOutput-${bucketName.replace(/\./g, "-")}-Arn` });
     //   new CfnOutput(this, `bucketOutput-${bucketName}-Arn`, { value: this._s3Bucket.bucketArn, exportName: `bucketOutput-${bucketName}-Arn` });
       // new CfnOutput(this, `bucketOutput-${bucketName}-Arn`, { value: this._s3Bucket.bucketArn, exportName: `bucketOutput-${bucketName}-Arn` });

        // new CfnOutput(this, 'bucketPipelineArn', { value: bucketPipeline.bucketArn, exportName: "bucketPipelineArn" });
    }


/*
    static getS3PipelineBucketArn(construct:Construct, prefix:string) : string {
        return bucketPipelineArn;
    }

    static getS3PipelineBucket(construct:Construct, prefix:string) {
        return cdk.aws_s3.Bucket.fromBucketArn(construct, `${prefix}-s3-bucket-pipeline`, bucketPipelineArn)
    }

    static getS3MediaBucket(construct:Construct, prefix:string) {
        return cdk.aws_s3.Bucket.fromBucketArn(construct, `${prefix}-s3-bucket-pipeline`, bucketPipelineArn)
    } */


/*    generateS3PipelineBucket() {

        const bucketPipelineName = 'codepipeline-ca-central-1-333554808283';
        bucketPipeline = this.generateS3Bucket(bucketPipelineName);
    } */



    generateBucketComponent(bucketName:string) {
        this.generateS3Bucket(bucketName);
        this.generateOutputs(bucketName);
    }
    generateS3Bucket(bucketName: string)  {

        this._s3Bucket =  new s3.Bucket(this, `s3-bucket-${bucketName}`, {
            bucketName: bucketName,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            /**
             * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
             * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
             * DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
             */
            removalPolicy: RemovalPolicy.RETAIN,

            /**
             * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
             * setting will enable full cleanup of the demo.
             */
            autoDeleteObjects: false, // NOT recommended for production code

        });
    }

    static generateDynamicS3Bucket(construct:Construct, bucketName: string)  {

        return  new s3.Bucket(construct, `s3-bucket-dynamic-${bucketName}`, {
            bucketName: bucketName,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            /**
             * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
             * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
             * DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
             */
            removalPolicy: RemovalPolicy.DESTROY,

            /**
             * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
             * setting will enable full cleanup of the demo.
             */
            autoDeleteObjects: true, // NOT recommended for production code
        });
    }


    initialize() {
       /*     new CfnParameter(this, "domain", {
                type: "String",
                description: "Environment Type.",
                default: "www.mamboleofc.ca",
            });

        bucketName = this.node.tryGetContext("domain") ?? bucketName;
*/
        this.generateBucketComponent('scheduler-config');
        this.generateBucketComponent('images.scheduler.page');
        this.generateBucketComponent('media.scheduler.page');
        this.generateBucketComponent('stage.scheduler.page');
        this.generateBucketComponent('www.scheduler.page');
//        this.generateBucketComponent('kofc9544-api-stage');
  //      this.generateBucketComponent('kofc9544-api-production');
    }
}
