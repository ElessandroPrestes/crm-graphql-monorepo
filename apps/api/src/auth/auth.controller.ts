import {
  Controller,
  Inject,
  ForbiddenException,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseFilters,
  Body,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { ApiEnv } from '../config/env.js';
import { clientIp } from '../common/client-ip.js';
import { LoginThrottledException } from '../common/rate-limit/login-throttled.exception.js';
import { RateLimitExceptionFilter } from '../common/rate-limit/rate-limit-exception.filter.js';
import { AuthService, type SessionResult } from './auth.service.js';
import { AuthThrottleService } from './auth-throttle.service.js';
import { CurrentUser } from './current-user.decorator.js';
import type { AuthenticatedUser } from './auth.types.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { LoginDto } from './login.dto.js';

@Controller('auth')
@UseFilters(RateLimitExceptionFilter)
export class AuthController {
  private readonly cookieName: string;
  private readonly cookieSecure: boolean;
  private readonly refreshTtl: number;
  private readonly allowedOrigins: string[];

  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(AuthThrottleService) private readonly throttle: AuthThrottleService,
    @Inject(ConfigService) config: ConfigService<ApiEnv, true>,
  ) {
    this.cookieName = config.get('REFRESH_COOKIE_NAME', { infer: true });
    this.cookieSecure = config.get('NODE_ENV', { infer: true }) === 'production';
    this.refreshTtl = config.get('REFRESH_TOKEN_TTL_SECONDS', { infer: true });
    this.allowedOrigins = config.get('CORS_ORIGINS', { infer: true });
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    user: AuthenticatedUser;
  }> {
    this.assertAllowedOrigin(request);

    await this.throttle.beforeLogin(clientIp(request), body.email);

    let session: SessionResult;

    try {
      session = await this.authService.login(body);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        const retryAfterSeconds = await this.throttle.recordFailure(body.email);

        if (retryAfterSeconds > 0) {
          throw new LoginThrottledException(retryAfterSeconds);
        }
      }

      throw error;
    }

    await this.throttle.reset(body.email);

    this.setRefreshCookie(response, session.refreshToken);

    return {
      accessToken: session.accessToken,
      tokenType: 'Bearer',
      expiresIn: session.expiresIn,
      user: session.user,
    };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    user: AuthenticatedUser;
  }> {
    this.assertAllowedOrigin(request);

    const session = await this.authService.refresh(this.getRefreshToken(request));

    this.setRefreshCookie(response, session.refreshToken);

    return {
      accessToken: session.accessToken,
      tokenType: 'Bearer',
      expiresIn: session.expiresIn,
      user: session.user,
    };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    this.assertAllowedOrigin(request);
    await this.authService.logout(this.getRefreshToken(request));
    this.clearRefreshCookie(response);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser): Promise<AuthenticatedUser> {
    return this.authService.me(user.id);
  }

  private getRefreshToken(request: Request): string {
    const cookies = request.cookies as Record<string, unknown> | undefined;
    const token = cookies?.[this.cookieName];

    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedException('Sessão inválida');
    }

    return token;
  }

  private setRefreshCookie(response: Response, token: string): void {
    response.cookie(this.cookieName, token, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'strict',
      path: '/auth',
      maxAge: this.refreshTtl * 1000,
    });
  }

  private clearRefreshCookie(response: Response): void {
    response.clearCookie(this.cookieName, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'strict',
      path: '/auth',
    });
  }

  private assertAllowedOrigin(request: Request): void {
    const origin = request.headers.origin;

    if (!origin) {
      return;
    }

    if (!this.allowedOrigins.includes(origin)) {
      throw new ForbiddenException('Origem não permitida');
    }
  }
}
