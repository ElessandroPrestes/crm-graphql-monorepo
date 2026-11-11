import { Field, GraphQLISODateTime, ObjectType } from '@nestjs/graphql';
import { ActivityType } from '../activities/activity.type.js';
import { CompanyType } from '../companies/company.type.js';
import { ConversationType } from '../conversations/conversation.type.js';
import { DealType } from '../deals/deal.type.js';
import { MessageType } from '../messages/message.type.js';
import { ContactType } from './contact.type.js';

@ObjectType()
export class ConversationExportItem {
  @Field(() => ConversationType)
  conversation!: ConversationType;

  @Field(() => [MessageType])
  messages!: MessageType[];
}

@ObjectType('ContactDataExport')
export class ContactDataExportType {
  @Field(() => GraphQLISODateTime)
  exportedAt!: Date;

  @Field(() => ContactType)
  contact!: ContactType;

  @Field(() => CompanyType, { nullable: true })
  company!: CompanyType | null;

  @Field(() => [DealType])
  deals!: DealType[];

  @Field(() => [ActivityType])
  activities!: ActivityType[];

  @Field(() => [ConversationExportItem])
  conversations!: ConversationExportItem[];
}
