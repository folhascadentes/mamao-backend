import { Body, Controller, Post } from '@nestjs/common';
import { SignDatabaseService } from './sign-database.service';
import { UploadSignPayload } from './types';

@Controller()
export class AppController {
  constructor(private readonly signDatabaseService: SignDatabaseService) {}

  @Post('/upload')
  public async save(
    @Body()
    body: UploadSignPayload,
  ): Promise<string> {
    return await this.signDatabaseService.upload(body);
  }
}
