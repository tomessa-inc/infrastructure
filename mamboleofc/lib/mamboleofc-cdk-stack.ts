import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib';
import {CachePolicy} from "aws-cdk-lib/aws-cloudfront";
import { Duration } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as ses from 'aws-cdk-lib/aws-ses';

const name = 'mamboleofc'
const zoneName = `${name}.ca`
const imageBucket = `images.${zoneName}`;
const maiFromDomain = `mail.${zoneName}`;

export class MamboleoFCCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'KofcGolfCdkQueue', {
    //   visibilityTimeout: dsp-cdk.Duration.seconds(300)
    // });

    const siteImageBucket = new s3.Bucket(this, 'SiteImageBucket', {
      bucketName: imageBucket,
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


        //Cache Policy
        const cachePolicy = new CachePolicy(this, 'cachePolicyCloudfront', {
          cachePolicyName: `${name}-year-policy`,
          comment: 'A policy to expire objects within a year',
          defaultTtl: Duration.days(365),
          minTtl: Duration.minutes(1),
          maxTtl: Duration.days(365),
          cookieBehavior: cloudfront.CacheCookieBehavior.none(),
          headerBehavior: cloudfront.CacheHeaderBehavior.none(),
          queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
        });


          const MamboleoFCHostName = new route53.PublicHostedZone(this, 'HostedZone', {
            zoneName: zoneName,
          });


          const identity = new ses.EmailIdentity(this, 'SESIdentity', {
            identity: ses.Identity.publicHostedZone(MamboleoFCHostName),
            mailFromDomain: maiFromDomain
          });

          
          new cdk.CfnOutput(this, 'MamboleoFCHostZoneId', { value: MamboleoFCHostName.hostedZoneId, exportName: "MamboleoFCHostZoneId" });
          new cdk.CfnOutput(this, 'MamboleoFCHostZoneName', { value: MamboleoFCHostName.zoneName, exportName: "MamboleoFCHostZoneName" });

  }
}
