import { Field, ObjectType } from '@nestjs/graphql';
import { PageInfoType } from '../common/pagination.js';
import { DealType } from './deal.type.js';

@ObjectType()
export class DealEdge {
  @Field(() => DealType)
  node!: DealType;

  @Field()
  cursor!: string;
}

@ObjectType()
export class DealConnection {
  @Field(() => [DealEdge])
  edges!: DealEdge[];

  @Field(() => PageInfoType)
  pageInfo!: PageInfoType;
}
