// Import dependencies
import { Injectable } from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmForgotPasswordCommandOutput,
  ConfirmSignUpCommand,
  ConfirmSignUpCommandOutput,
  ForgotPasswordCommand,
  ForgotPasswordCommandOutput,
  InitiateAuthCommand,
  InitiateAuthCommandOutput,
  SignUpCommand,
  SignUpCommandOutput,
  UpdateUserAttributesCommand,
  UpdateUserAttributesCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import * as crypto from 'crypto';
import { SignUpPayload, UpdateProfilePayload } from './types';

@Injectable()
export class AuthService {
  private cognito = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION,
  });

  public async signUp(payload: SignUpPayload): Promise<SignUpCommandOutput> {
    const command = new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: payload.email,
      Password: payload.password,
      SecretHash: this.calculateHMAC(payload.email),
      UserAttributes: Object.keys(payload)
        .map((key) => {
          if (key === 'email' || key === 'password') {
            return null;
          }

          const name = `custom:${key}`;
          let value = payload[key];

          if (typeof value === 'number') {
            value = value.toString();
          }

          if (value) {
            return {
              Name: name,
              Value: value,
            };
          }

          return null;
        })
        .filter(Boolean), // remove null entries
    });

    return await this.cognito.send(command);
  }

  public async confirmSignUp(
    email: string,
    code: string,
  ): Promise<ConfirmSignUpCommandOutput> {
    const command = new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      SecretHash: this.calculateHMAC(email),
    });

    return await this.cognito.send(command);
  }

  public async signIn(
    email: string,
    password: string,
  ): Promise<InitiateAuthCommandOutput> {
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

  public async forgetPassword(
    email: string,
  ): Promise<ForgotPasswordCommandOutput> {
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
  ): Promise<ConfirmForgotPasswordCommandOutput> {
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
  ): Promise<UpdateUserAttributesCommandOutput> {
    const command = new UpdateUserAttributesCommand({
      AccessToken: accessToken,
      UserAttributes: Object.keys(payload)
        .map((key) => {
          if (key === 'accessToken') {
            return null;
          }

          const name = `custom:${key}`;
          let value = payload[key];

          if (typeof value === 'number') {
            value = value.toString();
          }

          if (value) {
            return {
              Name: name,
              Value: value,
            };
          }

          return null;
        })
        .filter(Boolean),
    });

    return await this.cognito.send(command);
  }

  private calculateHMAC(username: string): string {
    const message = `${username}${process.env.COGNITO_CLIENT_ID}`;
    const hmac = crypto.createHmac('sha256', process.env.COGNITO_SECRET_KEY);
    hmac.update(message);
    return hmac.digest('base64');
  }
}
