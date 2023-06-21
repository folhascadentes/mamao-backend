import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';

@Injectable()
export class AppService {
  public async save(data: string[]): Promise<string> {
    const timestamp = new Date().getTime();
    const fileNames = await this.convertImagesToVideo(
      data,
      `output_${timestamp}`,
      timestamp,
    );
    await this.deleteTempFiles(fileNames);
    return 'Hello World!';
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
          'scale=640:-1',
          '-c:v',
          'libx264',
          '-pix_fmt',
          'yuv420p',
          '-r',
          '30',
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
      ); // Replace with your images path
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
