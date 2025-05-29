import { MembershipTier } from "~/server/membershipTier/types";
import { Prisma } from ".prisma/client";
import MembershipTierGetPayload = Prisma.MembershipTierGetPayload;

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
