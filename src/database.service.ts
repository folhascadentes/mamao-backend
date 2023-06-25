import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class DatabaseService {
  private bucketName = process.env.AWS_BUCKET_NAME;
  private s3 = new S3Client({ region: 'sa-east-1' });

  public async upload(dir: string, data: string[]): Promise<string> {
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
      const uploadedFileData = await this.uploadToS3(dir, videoFilePath);
      await this.deleteTempFiles(fileNames.concat(videoFilePath));
      return uploadedFileData.ETag;
    } catch (error) {
      if (fileNames) {
        await this.deleteTempFiles(fileNames);
      }
      throw error;
    }
  }

  private async uploadToS3(dir: string, filePath: string) {
    console.log('UPLOADING TO S3', filePath);

    const fileStream = fs.createReadStream(filePath);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: `${dir}/${path.basename(filePath)}`,
      Body: fileStream,
    });

    return await this.s3.send(command);
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
