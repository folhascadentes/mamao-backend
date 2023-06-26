import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SignDatabaseService } from './sign-database.service';
import { AuthService } from './auth.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AuthService, SignDatabaseService],
})
export class AppModule {}
