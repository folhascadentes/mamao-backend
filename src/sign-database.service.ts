import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { UploadSignPayload } from './types';

const SIGN_DATABASE_TABLE = 'sign-database';

@Injectable()
export class SignDatabaseService {
  private bucketName = process.env.AWS_BUCKET_NAME;
  private s3 = new S3Client({ region: 'sa-east-1' });
  private dynamo = new DynamoDBClient({ region: 'sa-east-1' });

  public async upload(payload: UploadSignPayload): Promise<string> {
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
      ).concat(videoFilePath);
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
      return uploadedFileData.ETag;
    } catch (error) {
      if (fileNames) {
        await this.deleteTempFiles(fileNames);
      }
      throw error;
    }
  }

  private async uploadToS3(userId: string, filePath: string) {
    console.log('UPLOADING TO S3', filePath);

    const fileStream = fs.createReadStream(filePath);

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
        landmarks: { S: JSON.stringify(record.landmarks) },
      },
    });

    return await this.dynamo.send(command);
  }

  private async convertImagesToVideo(
    base64Images: string[],
    outputVideoName: string,
    timestamp: number,
  ): Promise<string[]> {
    // decode Base64 strings to image files
    const filenames = await this.decodeBase64Images(base64Images, timestamp);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .on('end', () => {
          resolve(filenames);
        })
        .on('error', (err) => reject(new Error(`Error ${err}`)))
        .input(`/tmp/frame_${timestamp}_%d.jpg`) // Replace with your images path
        .inputFPS(25)
        .outputOptions('-c:v', 'libx264', '-crf', '28', '-r', '30')
        .output(`${outputVideoName}.mp4`) // Replace with your output path
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
      console.log(filename);
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
}