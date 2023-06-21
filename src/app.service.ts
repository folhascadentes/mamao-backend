import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';
import * as AWS from 'aws-sdk';

@Injectable()
export class AppService {
  private bucketName = process.env.AWS_BUCKET_NAME;

  constructor(
    private s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    }),
  ) {}

  public async save(data: string[]): Promise<string> {
    const timestamp = new Date().getTime();
    const outputVideoName = `output_${timestamp}`;
    let fileNames;
    try {
      fileNames = await this.convertImagesToVideo(
        data,
        outputVideoName,
        timestamp,
      );
      const videoFilePath = `${outputVideoName}.mp4`;
      const uploadedFileData = await this.uploadToS3(videoFilePath);
      await this.deleteTempFiles(fileNames);
      return uploadedFileData.Location;
    } catch (error) {
      console.error('Error:', error);
      if (fileNames) {
        await this.deleteTempFiles(fileNames);
      }
      throw error;
    }
  }

  private async uploadToS3(
    filePath: string,
  ): Promise<AWS.S3.ManagedUpload.SendData> {
    const fileStream = fs.createReadStream(filePath);

    const uploadParams = {
      Bucket: this.bucketName,
      Key: `videos/${path.basename(filePath)}`,
      Body: fileStream,
    };

    return this.s3.upload(uploadParams).promise();
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
        .input(`/tmp/image_${timestamp}_%d.jpg`) // Replace with your images path
        .inputFPS(25)
        .outputOptions(
          '-vf',
          'scale=720:720', // set output resolution
          '-c:v',
          'libx264',
          '-crf',
          '0', // set constant rate factor to 0 (lossless)
          '-pix_fmt',
          'yuv420p',
          '-r',
          '30', // set output frames per second
        )
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
      const filename = `image_${timestamp}_${i}.jpg`;
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
