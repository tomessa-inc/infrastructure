#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MamboleoFCCdkStack } from '../lib/mamboleofc-cdk-stack';
import {SiteCdkStack} from '../lib/cdk-stack'
import { SiteCICDCdkStack } from '../lib/cicd-stack';
import { APICICDCdkStack } from '../lib/mamboleofc-api-cicd-stack'
import {HostZoneCdkStack} from "../lib/host-zone-cdk-stack";
import {CertificationCdkStack} from "../lib/certification-cdk-stack";
import {CloudFrontCdkStack} from "../lib/cloud-front-cdk-stack";
import {S3BucketStack} from "../lib/s3-bucket-stack";
import {IAMRoleStack} from "../lib/iam-role-stack";
import {CodeBuildCdkStack} from "../lib/code-build-stack";
import {CICDCdkStack} from "../lib/cicd-pipeline-stack";
import {CicdApiPipelineStack} from "../lib/cicd-api-pipeline-stack";
import {CicdAdminPipelineStack} from "../lib/cicd-admin-pipeline-stack";
const app = new cdk.App();
new MamboleoFCCdkStack(app, 'MamboleoFCCdkStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

new SiteCdkStack(app, 'SiteCdkStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});


new SiteCICDCdkStack(app, 'SiteCICDCdkStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

new APICICDCdkStack(app, 'APICICDCdkStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

new HostZoneCdkStack(app, 'HostZoneCdkStack',  {

});

new CertificationCdkStack(app, 'CertificationCdkStack',  {

});

new CloudFrontCdkStack(app, 'CloudFrontCdkStack',  {

});

new S3BucketStack(app, 'S3BucketStack',  {

});

new IAMRoleStack(app, 'IAMRoleStack',  {

});


new CodeBuildCdkStack(app, 'CodeBuildCdkStack',  {

});

new CICDCdkStack(app, 'CICDCdkStack',  {

});

new CicdApiPipelineStack(app, 'CicdApiPipelineStack',  {

});

new CicdAdminPipelineStack(app, 'CicdAdminPipelineStack',  {

});
