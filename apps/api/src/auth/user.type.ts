import { Field, GraphQLISODateTime, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { UserRole } from '../generated/prisma/client.js';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Papel do usuário no CRM.',
});

@ObjectType('User')
export class UserType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field(() => UserRole)
  role!: UserRole;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}
