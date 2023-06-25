import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { SignDatabaseService } from './sign-database.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [SignDatabaseService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {});
});
