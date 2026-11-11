import {
  Inject,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import type { AuthenticatedUser, GqlContext } from './auth.types.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context).getContext<GqlContext>();

      if (gqlContext.user) {
        if (gqlContext.req) {
          gqlContext.req.user = gqlContext.user;
        }

        return true;
      }

      if (!gqlContext.req) {
        throw new UnauthorizedException('Sessão inválida');
      }

      const user = await this.authenticate(gqlContext.req);

      gqlContext.user = user;
      gqlContext.req.user = user;

      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    request.user = await this.authenticate(request);

    return true;
  }

  private async authenticate(request: Request): Promise<AuthenticatedUser> {
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Sessão inválida');
    }

    const token = authorization.slice('Bearer '.length).trim();

    if (token.length === 0) {
      throw new UnauthorizedException('Sessão inválida');
    }

    return this.authService.verifyAccessToken(token);
  }
}
