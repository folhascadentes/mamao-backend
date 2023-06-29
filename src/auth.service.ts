import { Injectable } from '@nestjs/common';
import {
  AttributeType,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  DeleteUserCommand,
  DeleteUserCommandOutput,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  SignUpCommand,
  UpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as crypto from 'crypto';
import { SignUpPayload, UpdateProfilePayload } from './types';

@Injectable()
export class AuthService {
  private readonly cognito: CognitoIdentityProviderClient;

  constructor() {
    this.cognito = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION,
    });
  }

  public async signUp(payload: SignUpPayload) {
    const command = new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: payload.email,
      Password: payload.password,
      SecretHash: this.calculateHMAC(payload.email),
      UserAttributes: this.filterUserAttributes(payload),
    });

    return await this.cognito.send(command);
  }

  public async confirmSignUp(email: string, code: string) {
    const command = new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      SecretHash: this.calculateHMAC(email),
    });

    return await this.cognito.send(command);
  }

  public async signIn(email: string, password: string) {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: this.calculateHMAC(email),
      },
    });

    return await this.cognito.send(command);
  }

  public async forgetPassword(email: string) {
    const command = new ForgotPasswordCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      SecretHash: this.calculateHMAC(email),
    });

    return await this.cognito.send(command);
  }

  public async confirmForgetPassword(
    email: string,
    code: string,
    newPassword: string,
  ) {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
      SecretHash: this.calculateHMAC(email),
    });

    return await this.cognito.send(command);
  }

  public async updateProfile(
    payload: UpdateProfilePayload,
    accessToken: string,
  ) {
    const command = new UpdateUserAttributesCommand({
      AccessToken: accessToken,
      UserAttributes: this.filterUserAttributes(payload),
    });

    return await this.cognito.send(command);
  }

  public async deleteAccount(
    accessToken: string,
  ): Promise<DeleteUserCommandOutput> {
    const command = new DeleteUserCommand({
      AccessToken: accessToken,
    });

    return await this.cognito.send(command);
  }

  private calculateHMAC(username: string): string {
    const message = `${username}${process.env.COGNITO_CLIENT_ID}`;
    const hmac = crypto.createHmac('sha256', process.env.COGNITO_SECRET_KEY);
    hmac.update(message);
    return hmac.digest('base64');
  }

  private filterUserAttributes(payload: any): AttributeType[] {
    return Object.entries(payload)
      .filter(
        ([key, value]) =>
          key !== 'accessToken' &&
          key !== 'email' &&
          key !== 'password' &&
          value,
      )
      .map(([key, value]) => ({
        Name: `custom:${key}`,
        Value: typeof value === 'number' ? value.toString() : value,
      })) as AttributeType[];
  }
}
