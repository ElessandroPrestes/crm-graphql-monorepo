import { Field, GraphQLISODateTime, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { DealStage } from './deal-stage.enum.js';

@InputType()
export class CreateDealInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title!: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  valueCents?: number;

  @Field(() => DealStage, { nullable: true, defaultValue: DealStage.LEAD })
  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @IsDate()
  expectedCloseDate?: Date | null;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  contactId?: string | null;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  companyId?: string | null;
}

@InputType()
export class UpdateDealInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  valueCents?: number;

  @Field(() => DealStage, { nullable: true })
  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @IsDate()
  expectedCloseDate?: Date | null;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  contactId?: string | null;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  companyId?: string | null;
}
