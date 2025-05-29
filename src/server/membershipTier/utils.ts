import { MembershipTier } from "~/server/membershipTier/types";
import MembershipTierGetPayload = Prisma.MembershipTierGetPayload;
import { Prisma } from "@prisma/client";

export const MEMBERSHIP_TIER_SELECT = {
  id: true,
  name: true,
  status: true,
  benefitDescription: true,
  contributionDescription: true,
  costPerMonthInUSD: true,
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
    costPerMonthInUSD: r.costPerMonthInUSD.toNumber(),
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
    .sort((a, b) => a.costPerMonthInUSD - b.costPerMonthInUSD);
}

export function isPrismaResultDefaultFreeTier(membershipTier: {
  costPerMonthInUSD: Prisma.Decimal;
}): boolean {
  // this is the definition of default free tier
  return membershipTier.costPerMonthInUSD.toNumber() === 0;
}
