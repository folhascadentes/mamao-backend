import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const envVariables = ['AWS_BUCKET_NAME'];

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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

  await app.listen(4000);
}

async function main() {
  await checkEnvVariables();
  await bootstrap();
}

main();
