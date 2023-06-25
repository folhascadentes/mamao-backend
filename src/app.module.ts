import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SignDatabaseService } from './sign-database.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [SignDatabaseService],
})
export class AppModule {}
