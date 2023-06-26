import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../guards/auth.guard';

export function Auth() {
  return applyDecorators(UseGuards(JwtGuard));
}
