import { HttpException, HttpStatus } from '@nestjs/common';

export class LoginThrottledException extends HttpException {
  constructor(public readonly retryAfterSeconds: number) {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: 'Muitas tentativas. Tente novamente mais tarde.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
