#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');

export class TestStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // The code that defines your stack goes here
    }
}

const app = new cdk.App();
new TestStack(app, 'TestStack');
