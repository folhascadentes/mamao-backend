import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

@Injectable()
export class JwtGuard implements CanActivate {
  private client = jwksClient({
    jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.CONGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  });

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;

    if (token) {
      const decoded = jwt.decode(token, { complete: true });
      const key = await this.client.getSigningKey(decoded.header.kid);

      try {
        const user = jwt.verify(token, key.getPublicKey());
        request.user = user;
        return true;
      } catch (err) {
        console.log('JWT is not valid');
        return false;
      }
    }
    return false;
  }
}
