import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/upload')
  public async save(
    @Body() body: { dir: string; data: string[] },
  ): Promise<string> {
    return await this.appService.upload(body.dir, body.data);
  }
}
