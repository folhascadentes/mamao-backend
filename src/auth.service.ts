// Import dependencies
import { Injectable } from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { SignUpPayload } from './types';

@Injectable()
export class AuthService {
  private cognito = new CognitoIdentityProviderClient({ region: 'sa-east-1' });

  async signUp(payload: SignUpPayload) {
    const command = new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: payload.email,
      Password: payload.password,
      UserAttributes: [
        {
          Name: 'custom:age',
          Value: payload.age?.toString(),
        },
        {
          Name: 'custom:gender',
          Value: payload.gender,
        },
        {
          Name: 'custom:ethnicity',
          Value: payload.etinicity,
        },
        {
          Name: 'custom:location',
          Value: payload.location,
        },
        {
          Name: 'custom:deficiency',
          Value: payload.deficiency,
        },
        {
          Name: 'custom:weight',
          Value: payload.weight?.toString(),
        },
        {
          Name: 'custom:height',
          Value: payload.height?.toString(),
        },
        {
          Name: 'custom:others',
          Value: payload.others,
        },
      ],
    });

    return await this.cognito.send(command);
  }

  async signIn(email: string, password: string): Promise<any> {}
}
