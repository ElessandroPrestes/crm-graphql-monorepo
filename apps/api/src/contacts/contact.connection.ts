import { Field, ObjectType } from '@nestjs/graphql';
import { PageInfoType } from '../common/pagination.js';
import { ContactType } from './contact.type.js';

@ObjectType()
export class ContactEdge {
  @Field(() => ContactType)
  node!: ContactType;

  @Field()
  cursor!: string;
}

@ObjectType()
export class ContactConnection {
  @Field(() => [ContactEdge])
  edges!: ContactEdge[];

  @Field(() => PageInfoType)
  pageInfo!: PageInfoType;
}
