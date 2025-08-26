import { Prisma } from "@prisma/client";
import type { MembershipCampaign } from "./types";
import {
  MEMBERSHIP_TIER_SELECT,
  asMembershipTier
} from "~/server/membershipTier/utils";

export const MEMBERSHIP_CAMPAIGN_SELECT = {
  id: true,
  membershipTierId: true,
  targetPerMonthInUSD: true,
  endDate: true,
  createdAt: true,
  budgetItems: {
    select: {
      id: true,
      label: true,
      costPerMonthInUSD: true,
      createdAt: true,
      updatedAt: true
    }
  },
  membershipTier: {
    select: MEMBERSHIP_TIER_SELECT
  }
} satisfies Prisma.MembershipCampaignSelect;

export function asMembershipCampaign(
  campaign: Prisma.MembershipCampaignGetPayload<{
    select: typeof MEMBERSHIP_CAMPAIGN_SELECT;
  }>,
  committedPerMonthInUSD: number,
  isTargetMet: boolean
): MembershipCampaign {
  return {
    id: campaign.id,
    membershipTier: asMembershipTier(campaign.membershipTier),
    targetPerMonthInUSD: campaign.targetPerMonthInUSD.toNumber(),
    budgetItems: campaign.budgetItems.map((item) => ({
      label: item.label,
      costPerMonthInUSD: item.costPerMonthInUSD.toNumber()
    })),
    endDate: campaign.endDate,
    committedPerMonthInUSD: committedPerMonthInUSD,
    isTargetMet: isTargetMet
  };
}
