import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';
import type { AuthenticatedUser, GqlContext } from './auth.types.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context).getContext<GqlContext>();

      if (!gqlContext.user) {
        throw new Error('CurrentUser usado sem autenticação');
      }

      return gqlContext.user;
    }

    const request = context.switchToHttp().getRequest<Request>();

    if (!request.user) {
      throw new Error('CurrentUser usado sem autenticação');
    }

    return request.user;
  },
);
