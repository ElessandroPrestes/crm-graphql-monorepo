import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { ContactType } from '../contacts/contact.type.js';
import { WhatsAppChannel } from './whatsapp-channel.enum.js';

@ObjectType('Conversation')
export class ConversationType {
  @Field(() => ID)
  id!: string;

  @Field(() => WhatsAppChannel)
  channel!: WhatsAppChannel;

  @Field(() => ID)
  contactId!: string;

  @Field(() => ID)
  accountId!: string;

  @Field(() => ID)
  ownerId!: string;

  @Field(() => GraphQLISODateTime)
  lastMessageAt!: Date;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;

  @Field(() => ContactType)
  contact?: ContactType;
}
