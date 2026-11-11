import { Field, ObjectType } from '@nestjs/graphql';
import { PageInfoType } from '../common/pagination.js';
import { CompanyType } from './company.type.js';

@ObjectType()
export class CompanyEdge {
  @Field(() => CompanyType)
  node!: CompanyType;

  @Field()
  cursor!: string;
}

@ObjectType()
export class CompanyConnection {
  @Field(() => [CompanyEdge])
  edges!: CompanyEdge[];

  @Field(() => PageInfoType)
  pageInfo!: PageInfoType;
}
