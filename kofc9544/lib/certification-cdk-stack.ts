import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { CfnOutput } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import {HostZoneCdkStack} from "./host-zone-cdk-stack";

const siteCertificationArn = cdk.Fn.importValue('siteCertificationArn')


export class CertificationCdkStack extends cdk.Stack {
    private _certificate:any;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.initialize();
    }

    initialize() {
        this.generateCertification();
        this.generateOutputs();
    }

    generateCertification() {
        const hostZoneName = HostZoneCdkStack.getHostZoneName();
        this._certificate  = new acm.Certificate(this, 'SiteDomainCertification', {
            domainName: `*.${hostZoneName}`,
            certificateName: 'Site Certification for kofc9544.ca', // Optionally provide an certificate name
            validation: acm.CertificateValidation.fromDns(HostZoneCdkStack.getHostZone(this, 'Route53ZoneCertification')),
        });
    }

    static getCertification(construct: Construct, id:string) {
        return acm.Certificate.fromCertificateArn(construct, `${id}-certification`, siteCertificationArn);
    }

    generateOutputs() {
        new CfnOutput(this, 'siteCertificationArn', { value: this._certificate.certificateArn, exportName: "siteCertificationArn" });

    }
}