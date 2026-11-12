import type { DealCardFragment, DealStage } from '@nexo/graphql-schema/operations';
import { OPEN_STAGES } from '../contacts/contact-utils';

export interface DealStageGroup {
  stage: DealStage;
  deals: DealCardFragment[];
  count: number;
  totalCents: number;
}

export function groupDealsByStage(deals: readonly DealCardFragment[]): DealStageGroup[] {
  return OPEN_STAGES.map((stage) => {
    const stageDeals = deals.filter((deal) => deal.stage === stage);

    return {
      stage,
      deals: stageDeals,
      count: stageDeals.length,
      totalCents: stageDeals.reduce((total, deal) => total + deal.valueCents, 0),
    };
  });
}

export function findDeal(
  deals: readonly DealCardFragment[],
  id: string,
): DealCardFragment | undefined {
  return deals.find((deal) => deal.id === id);
}
