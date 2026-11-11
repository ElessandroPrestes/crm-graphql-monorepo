import { Field, GraphQLISODateTime, ID, InputType } from '@nestjs/graphql';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ActivityType } from './activity-type.enum.js';

@InputType()
export class CreateActivityInput {
  @Field(() => ActivityType)
  @IsEnum(ActivityType)
  type!: ActivityType;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  subject!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @Field(() => GraphQLISODateTime)
  @IsDate()
  occurredAt!: Date;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  contactId?: string | null;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  dealId?: string | null;
}
