import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import type { AuthenticatedUser } from './auth.types.js';
import { CurrentUser } from './current-user.decorator.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { UserType } from './user.type.js';

@Resolver(() => UserType)
@UseGuards(JwtAuthGuard)
export class AuthResolver {
  @Query(() => UserType)
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
