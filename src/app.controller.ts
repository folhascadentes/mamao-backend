import { Body, Controller, Post } from '@nestjs/common';
import { SignDatabaseService } from './sign-database.service';

@Controller()
export class AppController {
  constructor(private readonly databaseService: SignDatabaseService) {}

  @Post('/upload')
  public async save(
    @Body() body: { dir: string; data: string[] },
  ): Promise<string> {
    return await this.databaseService.upload(body.dir, body.data);
  }
}
