import { Field, ObjectType } from '@nestjs/graphql';
import { PageInfoType } from '../common/pagination.js';
import { ActivityType } from './activity.type.js';

@ObjectType()
export class ActivityEdge {
  @Field(() => ActivityType)
  node!: ActivityType;

  @Field()
  cursor!: string;
}

@ObjectType()
export class ActivityConnection {
  @Field(() => [ActivityEdge])
  edges!: ActivityEdge[];

  @Field(() => PageInfoType)
  pageInfo!: PageInfoType;
}
