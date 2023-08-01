import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';
import * as zlib from 'zlib';
import { sampleSize } from 'lodash';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { UploadSignPayload } from './types';

const SIGN_DATABASE_TABLE = 'sign-database';
const TOTAL_SIGN_DATABASE_TABLE = 'total-sign-database';

@Injectable()
export class SignDatabaseService {
  private bucketName = process.env.AWS_BUCKET_NAME;
  private s3 = new S3Client({ region: process.env.AWS_REGION });
  private dynamo = new DynamoDBClient({ region: process.env.AWS_REGION });

  public async upload(
    payload: UploadSignPayload & { userId: string },
  ): Promise<{ etag: string }> {
    console.log('INITIATING UPLOAD');

    const timestamp = new Date().getTime();
    const outputVideoName = `${timestamp}`;
    let fileNames: string[] = [];

    try {
      const videoFilePath = `${outputVideoName}.mp4`;
      fileNames = (
        await this.convertImagesToVideo(
          payload.frames,
          outputVideoName,
          timestamp,
        )
      ).concat(`/tmp/${videoFilePath}`);
      const uploadedFileData = await this.uploadToS3(
        payload.userId,
        videoFilePath,
      );
      await this.uploadToDynamoDB({
        userId: payload.userId,
        language: payload.language,
        token: payload.token,
        timestamp,
        path: videoFilePath,
        landmarks: payload.landmarks,
      });
      await this.deleteTempFiles(fileNames);
      return { etag: uploadedFileData.ETag };
    } catch (error) {
      if (fileNames) {
        await this.deleteTempFiles(fileNames);
      }
      throw error;
    }
  }

  private async uploadToS3(userId: string, filePath: string) {
    console.log('UPLOADING TO S3', filePath);

    const fileStream = fs.createReadStream(`/tmp/${filePath}`);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: `${userId}/${path.basename(filePath)}`,
      Body: fileStream,
    });

    return await this.s3.send(command);
  }

  private async uploadToDynamoDB(record: {
    userId: string;
    language: string;
    token: string;
    timestamp: number;
    path: string;
    landmarks: any;
  }) {
    console.log('UPLOADING TO DYNAMODB');

    const command = new PutItemCommand({
      TableName: SIGN_DATABASE_TABLE,
      Item: {
        userId: { S: record.userId },
        language: { S: record.language },
        token: { S: record.token },
        timestamp: { N: record.timestamp.toString() },
        path: { S: record.path },
        landmarks: {
          S: zlib.gzipSync(JSON.stringify(record.landmarks)).toString('base64'),
        },
      },
    });

    return await this.dynamo.send(command);
  }

  private async convertImagesToVideo(
    base64Images: string[],
    outputVideoName: string,
    timestamp: number,
  ): Promise<string[]> {
    const ffmpegPath = path.join(__dirname, 'ffmpeg');

    // decode Base64 strings to image files
    const filenames = await this.decodeBase64Images(base64Images, timestamp);

    if (process.env.NODE_ENV !== 'development') {
      ffmpeg.setFfmpegPath(ffmpegPath);
    }

    return new Promise((resolve, reject) => {
      ffmpeg()
        .on('end', () => {
          resolve(filenames);
        })
        .on('error', (err) => reject(new Error(`Error ${err}`)))
        .input(`/tmp/frame_${timestamp}_%d.jpg`)
        .inputFPS(25)
        .outputOptions('-c:v', 'libx264', '-crf', '28', '-r', '30')
        .output(`/tmp/${outputVideoName}.mp4`)
        .run();
    });
  }

  private async decodeBase64Images(
    base64Images: string[],
    timestamp: number,
  ): Promise<string[]> {
    const filenames = [];

    for (let i = 0; i < base64Images.length; i++) {
      const filename = `frame_${timestamp}_${i}.jpg`;
      console.log('jpg ::', filename);
      await fs.promises.writeFile(
        `/tmp/${filename}`,
        base64Images[i],
        'base64',
      );
      filenames.push(`/tmp/${filename}`);
    }

    return filenames;
  }

  private async deleteTempFiles(filenames: string[]): Promise<void> {
    for (const filename of filenames) {
      try {
        await fs.promises.unlink(filename);
        console.log(`Deleted file: ${filename}`);
      } catch (err) {
        console.error(`Error deleting file ${filename}: ${err}`);
      }
    }
  }

  public async countSignByUserId(userId: string): Promise<number> {
    let lastEvaluatedKey;
    let totalItems = 0;

    do {
      const command = new QueryCommand({
        TableName: SIGN_DATABASE_TABLE,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :id',
        ExpressionAttributeValues: {
          ':id': { S: userId },
        },
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const response = await this.dynamo.send(command);
      totalItems += response.Items.length;

      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return totalItems;
  }

  public async getSession(): Promise<
    {
      language: string;
      token: string;
      total: number;
    }[]
  > {
    const command = new QueryCommand({
      TableName: TOTAL_SIGN_DATABASE_TABLE,
      KeyConditionExpression: '#language = :language',
      IndexName: 'LanguageTotalIndex',
      ExpressionAttributeNames: {
        '#language': 'language',
      },
      ExpressionAttributeValues: {
        ':language': { S: 'Libras' },
      },
      Limit: 100,
    });

    const response = await this.dynamo.send(command);

    const items = response.Items.map((item) => {
      return {
        language: item.language.S,
        token: item.token.S,
        total: Number(item.total.N),
      };
    });

    return this.selectSessionSigns(items);
  }

  private selectSessionSigns(
    signs: any[],
  ): { language: string; token: string; total: number }[] {
    const firstPart = signs.slice(0, 12);
    const secondPart = signs.slice(12, 25);
    const thirdPart = signs.slice(25, 100);

    const firstFive = sampleSize(firstPart, 5);
    const nextThree = sampleSize(secondPart, 3);
    const lastTwo = sampleSize(thirdPart, 2);

    return [...firstFive, ...nextThree, ...lastTwo];
  }
}
