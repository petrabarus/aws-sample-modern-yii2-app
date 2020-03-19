#!/usr/bin/env node
/*********************************
 * AWS CDK script to provision the resources.
 */

import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { WebApp } from './webapp';
import { Pipeline } from './pipeline';
import { Cluster } from './cluster';

class WebStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const cluster = new Cluster(this, 'Cluster');
        const webapp = new WebApp(this, 'WebApp', {
            cluster: cluster
        });
        const pipeline = new Pipeline(this, 'Pipeline', {
            webapp: webapp
        })
    }
}

const app = new cdk.App();
new WebStack(app, 'WebCiCdStack');
app.synth();