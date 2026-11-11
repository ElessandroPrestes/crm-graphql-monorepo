import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { ActivityType as ActivityKind } from './activity-type.enum.js';
import { DealType } from '../deals/deal.type.js';
import { ContactType } from '../contacts/contact.type.js';

@ObjectType('Activity')
export class ActivityType {
  @Field(() => ID)
  id!: string;

  @Field(() => ActivityKind)
  type!: ActivityKind;

  @Field()
  subject!: string;

  @Field(() => String, { nullable: true })
  notes!: string | null;

  @Field(() => GraphQLISODateTime)
  occurredAt!: Date;

  @Field(() => ID, { nullable: true })
  contactId!: string | null;

  @Field(() => ID, { nullable: true })
  dealId!: string | null;

  @Field(() => ID)
  ownerId!: string;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => ContactType, { nullable: true })
  contact?: ContactType | null;

  @Field(() => DealType, { nullable: true })
  deal?: DealType | null;
}
