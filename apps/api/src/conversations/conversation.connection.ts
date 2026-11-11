import { Field, ObjectType } from '@nestjs/graphql';
import { PageInfoType } from '../common/pagination.js';
import { ConversationType } from './conversation.type.js';

@ObjectType()
export class ConversationEdge {
  @Field(() => ConversationType)
  node!: ConversationType;

  @Field()
  cursor!: string;
}

@ObjectType()
export class ConversationConnection {
  @Field(() => [ConversationEdge])
  edges!: ConversationEdge[];

  @Field(() => PageInfoType)
  pageInfo!: PageInfoType;
}
