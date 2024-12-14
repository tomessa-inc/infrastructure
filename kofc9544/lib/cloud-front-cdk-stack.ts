import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import {aws_cloudfront, aws_iam, CfnOutput, Duration} from 'aws-cdk-lib';
import {CloudFrontTarget, LoadBalancerTarget} from 'aws-cdk-lib/aws-route53-targets';
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins";
import {CertificationCdkStack} from "./certification-cdk-stack";
import {S3BucketStack} from "./s3-bucket-stack";
import {HostZoneCdkStack} from "./host-zone-cdk-stack";


const distributionMedia = {id: cdk.Fn.importValue(`distributionId-media-kofc9544-ca`), name:cdk.Fn.importValue(`distributionDomainName-media-kofc9544-ca`) }
const distributionStage = {id: cdk.Fn.importValue(`distributionId-stage-kofc9544-ca`), name:cdk.Fn.importValue(`distributionDomainName-stage-kofc9544-ca`) }
const distributionWww = {id: cdk.Fn.importValue(`distributionId-www-kofc9544-ca`), name:cdk.Fn.importValue(`distributionDomainName-www-kofc9544-ca`) }
const distributionMember = {id: cdk.Fn.importValue(`distributionId-member-kofc9544-ca`), name:cdk.Fn.importValue(`distributionDomainName-member-kofc9544-ca`) }
const distributionMemberStage = {id: cdk.Fn.importValue(`distributionId-media-stage-kofc9544-ca`), name:cdk.Fn.importValue(`distributionDomainName-member-stage-kofc9544-ca`) }
const distributionGolf = {id: cdk.Fn.importValue(`distributionId-golf-kofc9544-ca`), name:cdk.Fn.importValue(`distributionDomainName-golf-kofc9544-ca`) }
const distributionGolfStage = {id: cdk.Fn.importValue(`distributionId-golf-stage-kofc9544-ca`), name:cdk.Fn.importValue(`distributionDomainName-golf-stage-kofc9544-ca`) }

var boo:any;
var cfnOriginAccessControl:any;

export class CloudFrontCdkStack extends cdk.Stack {
    private _oai: cdk.aws_cloudfront.OriginAccessIdentity;
    private _distribution: cdk.aws_cloudfront.Distribution
    private _cachePolicy:any;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.initialize();

    }

    async generateIdentity(domainName:string) {
        this._oai = new cloudfront.OriginAccessIdentity(this, `cloudfront-OAI-for-${domainName}`, {
            comment: `OAI for ${domainName}`,

        });
    }

    async generateTest() {
        cfnOriginAccessControl = new cloudfront.CfnOriginAccessControl(this, 'MyCfnOriginAccessControl', {
            originAccessControlConfig: {
                name: 'name',
                originAccessControlOriginType: 's3',
                signingBehavior: 'always',
                signingProtocol: 'sigv4',

                // the properties below are optional
                description: 'description',

            },
        });
    }

    async generateCloudFrontDistribution(domainName:string, entry: string) {

        const nocache = {
            cachePolicyId: "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
        }


      /*  cfnOriginAccessControl = new cloudfront.CfnOriginAccessControl(this, 'MyCfnOriginAccessControl', {
            originAccessControlConfig: {
                name: 'CloudFrontUser',
                originAccessControlOriginType: 's3',
                signingBehavior: 'always',
                signingProtocol: 'sigv4',

                // the properties below are optional
                description: 'description',

            },
        }); */
/*
        const originAccessIdentity = new cloudfront.CfnCloudFrontOriginAccessIdentity(this, 'MyOAI', {
            cloudFrontOriginAccessIdentityConfig: {
                comment: 'My CloudFront OAI'
            },

        });
/*
        const oaiS3BucketPolicy = new aws_iam.PolicyDocument({
            statements: [
                new aws_iam.PolicyStatement({
                    effect: aws_iam.Effect.ALLOW,
                    actions: ['s3:GetObject'],
                    resources: [`arn:aws:s3:::my-s3-bucket/*`],
                    principals: [new aws_iam.CanonicalUserPrincipal(cfnOriginAccessControl.attrS3CanonicalUserId)]
                })
            ]
        }); */
/*
        const test = new aws_iam.PolicyStatement({
            effect: aws_iam.Effect.ALLOW,
            actions: ['s3:GetObject'],
            resources: [`arn:aws:s3:::${domainName}/*`],

            principals: [new aws_iam.CanonicalUserPrincipal(cfnOriginAccessControl.attrS3CanonicalUserId)]
        })


        const bucket = S3BucketStack.getS3Bucket(this,domainName, "cloudfront");

        bucket.addToResourcePolicy(test)


*/

        boo = new cloudfront.OriginAccessIdentity(this, `cloudfront-OAI-${domainName}`, {
            comment: `OAI for ${domainName}`,

        });

        // CloudFront distribution
       this._distribution = new cloudfront.Distribution(this, `Distribution-${domainName}`, {
            certificate: CertificationCdkStack.getCertification(this, `distro-for-${domainName}`),
            defaultRootObject: "index.html",
            domainNames: [domainName],
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
                origin: new cloudfront_origins.S3Origin(S3BucketStack.getS3Bucket(this,domainName, "cloudfront"), { originAccessIdentity: boo, originShieldEnabled: true }),
                compress: true,

                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: entry.includes('stage') ? nocache : this._cachePolicy,
            },
            comment: `Distribution for ${domainName}`
        })
    }

    generateCachePolicy() {
        //Cache Policy
        this._cachePolicy = new aws_cloudfront.CachePolicy(this, 'cachePolicyCloudfront', {
            cachePolicyName: 'kofc9544-year-policy',
            comment: 'A policy to expire objects within a year',
            defaultTtl: Duration.days(365),
            minTtl:Duration.days(365),
            maxTtl: Duration.days(365),
            cookieBehavior: cloudfront.CacheCookieBehavior.none(),
            headerBehavior: cloudfront.CacheHeaderBehavior.none(),
            queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true,
        });


    }

    async generateOutputs(domain:string) {
        new CfnOutput(this, `distributionId-${domain}`, { value: this._distribution.distributionId, exportName: `distributionId-${domain.replace(/\./g, "-")}` });
        new CfnOutput(this, `domainNameDistribution-${domain}`, { value: this._distribution.domainName, exportName: `distributionDomainName-${domain.replace(/\./g, "-")}` });

      //  new CfnOutput(this, 'hostedZoneArn', { value: "arn:aws:route53:::hostedzone/Z0863375C6AG7U5NEC6", exportName: "hostedZoneArn" });
        //new CfnOutput(this, 'hostedZoneId', { value: "Z0863375C6AG7U5NEC6", exportName: "hostedZoneId" });
       // new CfnOutput(this, 'hostedZoneName', { value: "b4t.ca", exportName: "hostedZoneName" });
    }

    async generateComponent(domain:string, entry: string) {
      //  await this.generateIdentity(domain)
      //  await this.generateTest();
        await this.generateCloudFrontDistribution(domain, entry);
        await this.generateOutputs(domain);
        await HostZoneCdkStack.generateDNS(this, domain, entry)
    }

    async initialize() {
        this.generateCachePolicy();
        await this.generateComponent('www.kofc9544.ca', "www")
        await this.generateComponent('stage.kofc9544.ca',  "stage")
        await this.generateComponent('golf.kofc9544.ca', "golf")
        await this.generateComponent('golf-stage.kofc9544.ca',  "golf-stage")
        await this.generateComponent('member.kofc9544.ca',  "member");
        await this.generateComponent('member-stage.kofc9544.ca',  "member-stage");

    }


    static getDistribution(construct: Construct, domain: string) {
      //  console.log(domain);
        let id:string;
        let name: string;
        switch(domain) {
            case "media.kofc9544.ca":
            id = distributionMedia.id;
            name = distributionMedia.name;
            break;
            case "stage.kofc9544.ca":
                id = distributionStage.id;
                name = distributionStage.name
                break;
            case "golf.kofc9544.ca":
                id = distributionGolf.id;
                name = distributionGolf.name
                break;

            case "golf-stage.kofc9544.ca":
                id = distributionGolfStage.id;
                name = distributionGolfStage.name
                break;
            case "member-stage.kofc9544.ca":
                id = distributionMemberStage.id;
                name = distributionMemberStage.name
                break;

            case "member.kofc9544.ca":
                id = distributionMember.id;
                name = distributionMember.name
                break;

            default:
                id = distributionWww.id;
                name = distributionWww.name
                break;
        }

//        console.log('the id')
  //      console.log(id)
    //    console.log('domainname')
      //  console.log(domain)

        return cloudfront.Distribution.fromDistributionAttributes(construct, `Route53Zone-${domain}`,
            {domainName:name, distributionId: id})
    }
}