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
import { CfnOutput } from 'aws-cdk-lib';
import {CachePolicy} from "aws-cdk-lib/aws-cloudfront";

const siteDomainStage = 'stage.tc-testing.xyz';
const siteDomainProduction = 'www.tc-testing.xyz';
const domainProduction = 'tc-testing.xyz';
const mediaDomain = 'media.tc-testing.xyz';

const distributionId = 'E3FB2ZREFLI5G6';

const certificateDomain = '*.tc-testing.xyz';

export class SiteCdkStack extends cdk.Stack {
  declare myZone: route53.HostedZone;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, 'cloudfront-OAI', {
      comment: `OAI for ${id}`
    });

    const myHostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'Route53Zone', { hostedZoneId: 'Z00653292VZPDC4FXVT29', zoneName: 'tc-testing.xyz' })


  //route53.HostedZone
  //  const myZone = route53.HostedZone.fromHostedZoneAttributes(this, 'Route53TomvisionsZone', { hostedZoneId: 'Z2L2Y9R9WT05A6', zoneName: 'tomvisions.com' })


    const certificate = new acm.Certificate(this, 'SiteDomain', {
      domainName: certificateDomain,
      certificateName: 'Site Certification', // Optionally provide an certificate name
      validation: acm.CertificateValidation.fromDns(myHostedZone),
    });

    const siteBucketMedia = new s3.Bucket(this, 'SiteBucketMedia', {
      bucketName: mediaDomain,
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


    const siteBucketStage = new s3.Bucket(this, 'SiteBucketStage', {
      bucketName: siteDomainStage,
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

        const siteBucketProduction = new s3.Bucket(this, 'SiteBucketProduction', {
          bucketName: siteDomainProduction,
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


    // CloudFront distribution
    const distributionMedia = new cloudfront.Distribution(this, 'MediaSiteDistribution', {
      certificate: acm.Certificate.fromCertificateArn(this, 'mediaDistrbution', certificate.certificateArn),
      defaultRootObject: "index.html",
      domainNames: [mediaDomain],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(30),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(30),
        }
      ],
      defaultBehavior: {
        origin: new cloudfront_origins.S3Origin(siteBucketStage, { originAccessIdentity: cloudfrontOAI }),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      comment: "Distribution for Media Dynamic Sports Academy"
    })

    // CloudFront distribution
    const distributionStage = new cloudfront.Distribution(this, 'StageSiteDistribution', {
      certificate: acm.Certificate.fromCertificateArn(this, 'stageDistrbution', certificate.certificateArn),
      defaultRootObject: "index.html",
      domainNames: [siteDomainStage],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(30),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(30),
        }
      ],
      defaultBehavior: {
        origin: new cloudfront_origins.S3Origin(siteBucketStage, { originAccessIdentity: cloudfrontOAI }),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      comment: "Distribution for Stage Dynamic Sports Academy"
    })

        // CloudFront distribution
        const distributionProduction = new cloudfront.Distribution(this, 'ProductionSiteDistribution', {
          certificate: acm.Certificate.fromCertificateArn(this, 'productionDistribution', certificate.certificateArn),
          defaultRootObject: "index.html",
          domainNames: [siteDomainProduction],
          minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
          errorResponses: [
            {
              httpStatus: 403,
              responseHttpStatus: 403,
              responsePagePath: '/index.html',
              ttl: Duration.minutes(30),
            },
            {
              httpStatus: 404,
              responseHttpStatus: 404,
              responsePagePath: '/index.html',
              ttl: Duration.minutes(30),
            }
          ],
          defaultBehavior: {
            origin: new cloudfront_origins.S3Origin(siteBucketProduction, { originAccessIdentity: cloudfrontOAI }),
            compress: true,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          },
          comment: "Distribution for Production Dynamic Sports Academy"
        })

    //const myZone = route53.HostedZone.fromHostedZoneAttributes(this, 'Route53TomvisionsZone', {hostedZoneId: 'Z2L2Y9R9WT05A6', zoneName: 'tomvisions.com'})

    const route53Stage = new route53.ARecord(this, 'Route53AliasSiteStage', {
      zone: myHostedZone,
      target: route53.RecordTarget.fromAlias(new CloudFrontTarget(distributionStage)),
      recordName: 'stage'
    })

    const route53Production = new route53.ARecord(this, 'Route53AliasSiteProduction', {
      zone: myHostedZone,
      target: route53.RecordTarget.fromAlias(new CloudFrontTarget(distributionProduction)),
      recordName: 'www'
    })



    new CfnOutput(this, 'StageBucketSiteArn', { value: siteBucketStage.bucketArn, exportName: "StageBucketSiteArn" });
    new CfnOutput(this, 'ProductionBucketSiteArn', { value: siteBucketProduction.bucketArn, exportName: "ProductionBucketSiteArn" });
  }
}


const app = new cdk.App();
export const gallery = new SiteCdkStack(app, 'SiteCdkStack')
app.synth();
