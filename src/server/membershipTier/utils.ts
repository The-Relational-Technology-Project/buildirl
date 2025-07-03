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
  costPerMonthInUSD: true,
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
    costPerMonthInUSD: r.costPerMonthInUSD.toNumber(),
    costPerBillingInterval:
      r.costPerBillingInterval === null
        ? null
        : r.costPerBillingInterval.toNumber(),
    billingInterval: r.billingInterval as BillingInterval | null,
    initiationFeeCostInUSD:
      null === r.initiationFeeCostInUSD
        ? null
        : r.initiationFeeCostInUSD.toNumber()
  };
}

export function orderedByCost(
  membershipTiers: MembershipTier[]
): MembershipTier[] {
  return membershipTiers
    .sort((a, b) => a.id - b.id)
    .sort(
      (a, b) =>
        (a.costPerBillingInterval ?? a.costPerMonthInUSD) -
        (b.costPerBillingInterval ?? b.costPerMonthInUSD)
    );
}

export function isPrismaResultDefaultFreeTier(membershipTier: {
  costPerMonthInUSD: Prisma.Decimal;
}): boolean {
  // this is the definition of default free tier
  return membershipTier.costPerMonthInUSD.toNumber() === 0;
}

export function isPrismaResultDefaultFreeTierV2(membershipTier: {
  costPerMonthInUSD: Prisma.Decimal;
  costPerBillingInterval: Prisma.Decimal | null;
}): boolean {
  // V2 definition: use costPerBillingInterval if available, fallback to costPerMonthInUSD
  const effectiveCost = membershipTier.costPerBillingInterval !== null 
    ? membershipTier.costPerBillingInterval.toNumber()
    : membershipTier.costPerMonthInUSD.toNumber();
  return effectiveCost === 0;
}

export function getEffectiveCost(membershipTier: {
  costPerMonthInUSD: Prisma.Decimal;
  costPerBillingInterval: Prisma.Decimal | null;
}): number {
  // Helper function to get the effective cost for V2 tiers
  return membershipTier.costPerBillingInterval !== null 
    ? membershipTier.costPerBillingInterval.toNumber()
    : membershipTier.costPerMonthInUSD.toNumber();
}
