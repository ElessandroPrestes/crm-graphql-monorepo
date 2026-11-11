import { Field, ObjectType } from '@nestjs/graphql';
import { PageInfoType } from '../common/pagination.js';
import { MessageType } from './message.type.js';

@ObjectType()
export class MessageEdge {
  @Field(() => MessageType)
  node!: MessageType;

  @Field()
  cursor!: string;
}

@ObjectType()
export class MessageConnection {
  @Field(() => [MessageEdge])
  edges!: MessageEdge[];

  @Field(() => PageInfoType)
  pageInfo!: PageInfoType;
}
