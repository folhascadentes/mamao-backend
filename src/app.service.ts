import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';

@Injectable()
export class AppService {
  public async save(data: string[]): Promise<string> {
    await this.convertImagesToVideo(data, 'output');
    return 'Hello World!';
  }

  private async convertImagesToVideo(
    base64Images: string[],
    outputVideoName: string,
  ) {
    // decode Base64 strings to image files
    const imagePaths = await this.decodeBase64Images(base64Images);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .on('end', () => resolve('Video created'))
        .on('error', (err) => reject(new Error(`Error ${err}`)))
        .input('/tmp/image%d.jpg') // Replace with your images path
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

  private async decodeBase64Images(base64Images: string[]): Promise<string[]> {
    const filenames = [];

    for (let i = 0; i < base64Images.length; i++) {
      const filename = `image${i}.jpg`;
      console.log(filename);
      await fs.promises.writeFile(
        `/tmp/${filename}`,
        base64Images[i],
        'base64',
      ); // Replace with your images path
      filenames.push(filename);
    }

    return filenames;
  }
}