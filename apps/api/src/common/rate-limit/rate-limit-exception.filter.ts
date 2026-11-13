import { ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { LoginThrottledException } from './login-throttled.exception.js';

@Catch(LoginThrottledException)
export class RateLimitExceptionFilter implements ExceptionFilter {
  catch(exception: LoginThrottledException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.setHeader('Retry-After', String(exception.retryAfterSeconds));
    response.status(exception.getStatus()).json(exception.getResponse());
  }
}
