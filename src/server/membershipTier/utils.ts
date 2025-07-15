import {
  MembershipTier
} from "~/server/membershipTier/types";
import { BillingInterval } from "~/utils/types";
import MembershipTierGetPayload = Prisma.MembershipTierGetPayload;
import { Prisma } from "@prisma/client";

export const MEMBERSHIP_TIER_SELECT = {
  id: true,
  name: true,
  status: true,
  benefitDescription: true,
  contributionDescription: true,
  costPerBillingInterval: true,
  billingInterval: true,
  initiationFeeCostInUSD: true
};

export function asMembershipTier(
  r: MembershipTierGetPayload<{ select: typeof MEMBERSHIP_TIER_SELECT }>
): MembershipTier {
  return {
    id: r.id,
    name: r.name,
    status: r.status,
    benefitDescription: r.benefitDescription,
    contributionDescription: r.contributionDescription,
    // possible loss of precision here, but it doesn't matter for us
    costPerBillingInterval: r.costPerBillingInterval.toNumber(),
    billingInterval: r.billingInterval as BillingInterval,
    initiationFeeCostInUSD:
      null === r.initiationFeeCostInUSD
        ? null
        : r.initiationFeeCostInUSD.toNumber()
  };
}

function getBillingIntervalSortPriority(interval: BillingInterval): number {
  switch (interval) {
    case BillingInterval.MONTHLY:
      return 1;
    case BillingInterval.QUARTERLY:
      return 2;
    case BillingInterval.SEMI_ANNUAL:
      return 3;
    default:
      return 999;
  }
}

export function orderedByPricing(
  membershipTiers: MembershipTier[]
): MembershipTier[] {
  return membershipTiers
    .sort((a, b) => a.id - b.id) 
    .sort((a, b) => a.costPerBillingInterval - b.costPerBillingInterval)
    .sort((a, b) => getBillingIntervalSortPriority(a.billingInterval) - getBillingIntervalSortPriority(b.billingInterval));
}

export function isPrismaResultDefaultFreeTier(membershipTier: {
  costPerBillingInterval: Prisma.Decimal;
}): boolean {
  return membershipTier.costPerBillingInterval.toNumber() === 0;
}

