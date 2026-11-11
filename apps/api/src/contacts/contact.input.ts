import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class CreateContactInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName!: string;

  @Field()
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  companyId?: string | null;
}

@InputType()
export class UpdateContactInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  companyId?: string | null;
}
