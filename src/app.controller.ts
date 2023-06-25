import { Body, Controller, Post } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller()
export class AppController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Post('/upload')
  public async save(
    @Body() body: { dir: string; data: string[] },
  ): Promise<string> {
    return await this.databaseService.upload(body.dir, body.data);
  }
}
