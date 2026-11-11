import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { MessageDirection } from './message-direction.enum.js';
import { MessageStatus } from './message-status.enum.js';

@ObjectType('Message')
export class MessageType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  conversationId!: string;

  @Field(() => MessageDirection)
  direction!: MessageDirection;

  @Field(() => MessageStatus)
  status!: MessageStatus;

  @Field()
  body!: string;

  @Field(() => String, { nullable: true })
  externalId!: string | null;

  @Field(() => String, { nullable: true })
  clientMessageId!: string | null;

  @Field(() => GraphQLISODateTime)
  sentAt!: Date;

  @Field(() => String, { nullable: true })
  errorCode!: string | null;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}
