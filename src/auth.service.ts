// Import dependencies
import { Injectable } from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as crypto from 'crypto';
import { SignUpPayload } from './types';

@Injectable()
export class AuthService {
  private cognito = new CognitoIdentityProviderClient({ region: 'sa-east-1' });

  public async signUp(payload: SignUpPayload) {
    const command = new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: payload.email,
      Password: payload.password,
      SecretHash: this.calculateHMAC(
        process.env.COGNITO_SECRET_KEY,
        process.env.COGNITO_CLIENT_ID,
        payload.email,
      ),
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

  public async confirmSignUp(email: string, code: string): Promise<any> {
    const command = new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      SecretHash: this.calculateHMAC(
        process.env.COGNITO_SECRET_KEY,
        process.env.COGNITO_CLIENT_ID,
        email,
      ),
    });

    return await this.cognito.send(command);
  }

  public async signIn(email: string, password: string): Promise<any> {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: this.calculateHMAC(
          process.env.COGNITO_SECRET_KEY,
          process.env.COGNITO_CLIENT_ID,
          email,
        ),
      },
    });

    return await this.cognito.send(command);
  }

  private calculateHMAC(secretKey: string, clientId: string, username: string) {
    const message = `${username}${clientId}`;
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(message);
    return hmac.digest('base64');
  }
}
