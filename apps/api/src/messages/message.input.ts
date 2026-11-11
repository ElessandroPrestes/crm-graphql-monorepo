import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

@InputType()
export class SendMessageInput {
  @Field(() => ID)
  @IsUUID()
  conversationId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  text!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  clientMessageId?: string;
}
