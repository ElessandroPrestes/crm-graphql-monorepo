import { Field, GraphQLISODateTime, ID, Int, ObjectType } from '@nestjs/graphql';
import { CompanyType } from '../companies/company.type.js';
import { ContactType } from '../contacts/contact.type.js';
import { DealStage } from './deal-stage.enum.js';

@ObjectType('Deal')
export class DealType {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field(() => Int)
  valueCents!: number;

  @Field(() => DealStage)
  stage!: DealStage;

  @Field(() => Int)
  version!: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  expectedCloseDate!: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  closedAt!: Date | null;

  @Field(() => ID, { nullable: true })
  contactId!: string | null;

  @Field(() => ID, { nullable: true })
  companyId!: string | null;

  @Field(() => ID)
  ownerId!: string;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;

  @Field(() => ContactType, { nullable: true })
  contact?: ContactType | null;

  @Field(() => CompanyType, { nullable: true })
  company?: CompanyType | null;
}
