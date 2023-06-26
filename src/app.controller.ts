import { Body, Controller, Post } from '@nestjs/common';
import { SignDatabaseService } from './sign-database.service';
import {
  ConfirmSignUpPayload,
  SignInPayload,
  SignUpPayload,
  UploadSignPayload,
} from './types';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { UserId } from './decorators/user-id.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService,
    private readonly signDatabaseService: SignDatabaseService,
  ) {}

  @Post('/sign-up')
  public async signUp(
    @Body()
    body: SignUpPayload,
  ): Promise<any> {
    return await this.authService.signUp(body);
  }

  @Post('/confirm-sign-up')
  public async confirmSignUp(
    @Body()
    body: ConfirmSignUpPayload,
  ): Promise<any> {
    return await this.authService.confirmSignUp(body.email, body.code);
  }

  @Post('/sign-in')
  public async signIn(
    @Body()
    body: SignInPayload,
  ): Promise<any> {
    return await this.authService.signIn(body.email, body.password);
  }

  @Post('/upload')
  @Auth()
  public async save(
    @Body()
    body: UploadSignPayload,
    @UserId() userId: string,
  ): Promise<string> {
    return await this.signDatabaseService.upload({ ...body, userId });
  }
}
