import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { SignDatabaseService } from './sign-database.service';
import {
  ConfirmSignUpPayload,
  SignInPayload,
  SignUpPayload,
  UpdateProfilePayload,
  UploadSignPayload,
} from './types';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { Token, UserId } from './decorators/user-id.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService,
    private readonly signDatabaseService: SignDatabaseService,
  ) {}

  @Get('/profile')
  @Auth()
  public async getProfile(@UserId() userId: string, @Token() token: string) {
    const signCount = await this.signDatabaseService.countSignByUserId(userId);
    const profileInfo = await this.authService.getUserProfile(token);

    return {
      ...profileInfo,
      signs: signCount,
    };
  }

  @Post('/sign-up')
  public async signUp(
    @Body()
    body: SignUpPayload,
  ) {
    return await this.authService.signUp(body);
  }

  @Post('/confirm-sign-up')
  public async confirmSignUp(
    @Body()
    body: ConfirmSignUpPayload,
  ) {
    return await this.authService.confirmSignUp(body.email, body.code);
  }

  @Post('/sign-in')
  public async signIn(
    @Body()
    body: SignInPayload,
  ) {
    return await this.authService.signIn(body.email, body.password);
  }

  @Post('/forget-password')
  public async forgetPassword(
    @Body()
    body: {
      email: string;
    },
  ) {
    return await this.authService.forgetPassword(body.email);
  }

  @Post('/confirm-forget-password')
  public async confirmForgetPassword(
    @Body()
    body: {
      email: string;
      code: string;
      newPassword: string;
    },
  ) {
    return await this.authService.confirmForgetPassword(
      body.email,
      body.code,
      body.newPassword,
    );
  }

  @Post('/update-profile')
  @Auth()
  public async updateProfile(
    @Body()
    body: UpdateProfilePayload,
    @Token() token: string,
  ) {
    return await this.authService.updateProfile(body, token);
  }

  @Delete('/delete-account')
  @Auth()
  public async deleteAccount(@Token() token: string) {
    return await this.authService.deleteAccount(token);
  }

  @Post('/upload')
  @Auth()
  public async save(
    @Body()
    body: UploadSignPayload,
    @UserId() userId: string,
  ): Promise<{ etag: string }> {
    return await this.signDatabaseService.upload({ ...body, userId });
  }

  @Get('/sign/count')
  public signCountByUser(@Query('userId') userId: string) {
    return this.signDatabaseService.countSignByUserId(userId);
  }
}
