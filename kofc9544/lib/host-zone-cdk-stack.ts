import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { CfnOutput } from 'aws-cdk-lib';
import {CloudFrontTarget, LoadBalancerTarget} from 'aws-cdk-lib/aws-route53-targets';
import {Distribution} from "aws-cdk-lib/aws-cloudfront";
import {CloudFrontCdkStack} from "./cloud-front-cdk-stack";

const zoneName = 'kofc9544.ca'
const hostedZoneId  = cdk.Fn.importValue('hostedZoneId')
const hostedZoneArn  = cdk.Fn.importValue('hostedZoneArn')
const hostedZoneName  = cdk.Fn.importValue('hostedZoneName')


export class HostZoneCdkStack extends cdk.Stack {
    private _hostedZone:cdk.aws_route53.PublicHostedZone;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.initialize();
    }

    generateHostZone() {
        this._hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
           zoneName: zoneName,
         });
    }



    generateOutputs() {
        new CfnOutput(this, 'hostedZoneArn', { value: this._hostedZone.hostedZoneArn, exportName: "hostedZoneArn" });
        new CfnOutput(this, 'hostedZoneId', { value: this._hostedZone.hostedZoneId, exportName: "hostedZoneId" });
        new CfnOutput(this, 'hostedZoneName', { value: this._hostedZone.zoneName, exportName: "hostedZoneName" });
    }

    initialize() {
        this.generateHostZone();
        this.generateOutputs();
    }

    static getDomainName() {
        return `*.${zoneName}`
    }


    static getHostZoneName() {
        return hostedZoneName
    }


    static getHostZoneId() {
        return hostedZoneId
    }

    static getHostZone(construct: Construct, id: string) {

        return route53.HostedZone.fromHostedZoneAttributes(construct, `Route53Zone-${id}`,
            {hostedZoneId: hostedZoneId, zoneName: hostedZoneName})
    }

    static async generateDNS(construct:Construct, domain:string, entry:string) {
        const myHostedZone = this.getHostZone(construct, entry)

        console.log('the entry')
        console.log(entry);
        console.log("myHostedZone");
        console.log(myHostedZone)

        return new route53.ARecord(construct, `Route53Entry-${domain}-${entry}`, {
            zone: myHostedZone,
            target: route53.RecordTarget.fromAlias(new CloudFrontTarget(CloudFrontCdkStack.getDistribution(construct, domain))),
            recordName: entry
        })

    }
}