import { Field, GraphQLISODateTime, Int, ObjectType } from '@nestjs/graphql';
import { DealStage } from '../deals/deal-stage.enum.js';

@ObjectType()
export class DealStageMetricType {
  @Field(() => DealStage)
  stage!: DealStage;

  @Field(() => Int)
  count!: number;

  @Field(() => Int)
  valueCents!: number;
}

@ObjectType('DashboardMetrics')
export class DashboardMetricsType {
  @Field(() => Int)
  openDeals!: number;

  @Field(() => Int)
  openValueCents!: number;

  @Field(() => Int)
  wonDeals!: number;

  @Field(() => Int)
  wonValueCents!: number;

  @Field(() => Int)
  lostDeals!: number;

  @Field(() => Int)
  lostValueCents!: number;

  @Field(() => [DealStageMetricType])
  stages!: DealStageMetricType[];

  @Field(() => GraphQLISODateTime)
  generatedAt!: Date;
}
