import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  public async save(@Body() body: { data: string[] }): Promise<string> {
    return await this.appService.save(body.data);
  }
}
