require('dotenv').config();

import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createServer, proxy } from 'aws-serverless-express';
import { Handler } from 'express';

const envVariables = [
  'AWS_BUCKET_NAME',
  'AWS_REGION',
  'CONGNITO_USER_POOL_ID',
  'COGNITO_CLIENT_ID',
  'COGNITO_SECRET_KEY',
];

async function checkEnvVariables() {
  for (let envVariable of envVariables) {
    if (!process.env[envVariable]) {
      throw new Error(`Environment variable ${envVariable} is missing`);
    }
  }

  if (process.env.NODE_ENV === 'development') {
    const credentialsFilePath = path.join(os.homedir(), '.aws', 'credentials');

    return new Promise((resolve) => {
      fs.access(credentialsFilePath, fs.constants.F_OK, (err) => {
        if (err) {
          throw new Error(
            'Please create AWS credentials file (~/.aws/credentials))',
          );
        } else {
          resolve(true);
        }
      });
    });
  }
}

async function bootstrap(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

  await app.init();

  return app;
}

async function main() {
  await checkEnvVariables();
  const app = await bootstrap();
  await app.listen(4000);
}

if (process.env.NODE_ENV === 'development') {
  main();
}

let cachedServer: any;

const handler: Handler = async (event: any, context: any) => {
  if (!cachedServer) {
    const app = await bootstrap();
    const expressApp = app.getHttpAdapter().getInstance();
    cachedServer = createServer(expressApp);
  }

  return proxy(cachedServer, event, context, 'PROMISE').promise;
};

export { handler };