import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
 import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as api from 'aws-cdk-lib/aws-apigateway';
import {RestApi} from "aws-cdk-lib/aws-apigateway";

import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import {Duration} from "aws-cdk-lib";
import {ApiGateway, ApiGatewayProps} from "aws-cdk-lib/aws-events-targets";



//import * as events from "events";


export class MamboleofcCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

      const fn = new lambda.Function(this, 'MyFunction', {
          runtime: lambda.Runtime.PYTHON_3_7,
          handler: 'app.lambda_handler',
          code: lambda.Code.fromAsset('./my_function'),
      });

      const restApi = new api.LambdaRestApi( this, 'MyRestAPI', { handler: fn } );


      const rule = new events.Rule(this, 'Rule', {
          schedule: events.Schedule.rate(Duration.minutes(1)),
      });

      const dlq = new sqs.Queue(this, 'DeadLetterQueue');

      rule.addTarget(
          new targets.ApiGateway( restApi, {
              path: '/*/test',
              method: 'GET',
              stage:  'prod',
              pathParameterValues: ['path-value'],
              headerParameters: {
                  Header1: 'header1',
              },
              queryStringParameters: {
                  QueryParam1: 'query-param-1',
              },
              deadLetterQueue: dlq
          } ),
      )

      new ApiGateway(restApi)
    //  new ApiGateway(restApi: RestApi, props?: ApiGatewayProps)

    // example resource
    // const queue = new sqs.Queue(this, 'MamboleofcCdkQueue', {
    //   visibilityTimeout: dsp-cdk.Duration.seconds(300)
    // });
  }
}
